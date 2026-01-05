# -*- coding: utf-8 -*-
import os
import time
import faiss
import numpy as np
import pandas as pd
import google.generativeai as genai
from pymongo import MongoClient
from threading import Thread
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHOP_INDEX_PATH = os.path.join(BASE_DIR, "shop_faiss.bin")
SHOP_DATA_PATH = os.path.join(BASE_DIR, "shop_cache.parquet")


class ShopRAGMongo:
    def __init__(self, api_key, mongo_uri, db_name="TINYPAWS", collection="products", categories_collection="categories"):
        self.api_key = api_key
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.collection_name = collection
        self.categories_collection_name = categories_collection
        self.embedding_model_name = "models/text-embedding-004"
        
        self.df = pd.DataFrame()
        self.index = None
        self.llm_model = None
        self.db_client = None
        self.db_collection = None
        self.embedding_dimension = 768
        self.similarity_threshold = 0.40 

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        try:
            self.db_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            self.db_collection = self.db_client[db_name][collection]
            print(f"Kết nối MongoDB thành công: {db_name}.{collection}")
        except Exception as e:
            print(f"Lỗi kết nối MongoDB: {e}")
            self.db_client = None

        self.available_brands = [] 
        
    # === Lấy danh sách Categories về làm từ điển ===
    def get_category_map(self):
        """Tạo từ điển {ID: Tên Danh Mục}"""
        try:
            cat_coll = self.db_client[self.db_name][self.categories_collection_name]
            cursor = cat_coll.find({}, {"_id": 1, "name": 1})
            cat_map = {str(doc["_id"]): doc["name"] for doc in cursor}
            return cat_map
        except Exception as e:
            print(f"Lỗi lấy danh mục: {e}")
            return {}

    # === Load data from MongoDB ===
    def load_data(self):
        if self.db_collection is None:
            return False
            
        try:
            cat_map = self.get_category_map()
            print(f"Đã tải {len(cat_map)} danh mục để tham chiếu.")

            projection = {
                "name": 1, "description": 1, "price": 1, 
                "sale_price": 1, "stock_quantity": 1, "category": 1, 
                "brand": 1, "tags": 1 
            }
            products = list(self.db_collection.find({}, projection))
            
            if not products:
                 print("MongoDB rỗng.")
                 self.df = pd.DataFrame()
                 return True

            self.df = pd.DataFrame(products)
            self.df["_id"] = self.df["_id"].astype(str)
            if "category" in self.df.columns:
                self.df["category"] = self.df["category"].astype(str)
            
            if "brand" not in self.df.columns:
                self.df["brand"] = ""
            self.df["brand"] = self.df["brand"].fillna("").astype(str)

            if "tags" not in self.df.columns:
                self.df["tags"] = [[] for _ in range(len(self.df))]
            
            # Hàm xử lý từng dòng
            def create_full_text(row):
                price_str = f"{row.get('price', 0)}"
                if row.get('sale_price') and row.get('sale_price') > 0:
                    price_str = f"{row['sale_price']} (Gốc: {row['price']})"
                
                cat_id = str(row.get('category', ''))
                cat_name = cat_map.get(cat_id, "Sản phẩm")
                brand_name = row.get('brand', '')
                
                tags_data = row.get('tags', [])
                if isinstance(tags_data, list):
                    tags_str = ", ".join([str(t) for t in tags_data])
                else:
                    tags_str = str(tags_data)

                return (
                    f"Từ khóa tags: {tags_str}. "
                    f"Tên: {row['name']}. " 
                    f"Thương hiệu: {brand_name}. "
                    f"Loại: {cat_name}. "
                    f"Mô tả: {row.get('description', '')}. "
                    f"Giá: {price_str} VND. "
                    f"Kho: {row.get('stock_quantity', 0)}"
                )

            self.df["full_text"] = self.df.apply(create_full_text, axis=1)
            return True

        except Exception as e:
            print(f"Lỗi load data: {e}")
            return False

    def get_embedding(self, text):
        try:
            result = genai.embed_content(model=self.embedding_model_name, content=text)
            return result["embedding"]
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None

    def llm_generate_with_retry(self, prompt, max_retries=3, backoff=2.0):
        for attempt in range(max_retries):
            try:
                response = self.llm_model.generate_content(prompt)
                return response.text
            except Exception as e:
                print(f"Lỗi LLM (lần {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(backoff * (attempt + 1))
        return "Xin lỗi, tôi tạm thời không thể trả lời lúc này."

    def build_index(self):
        print("Đang tạo embeddings cho sản phẩm...")
        if self.df.empty or 'full_text' not in self.df.columns:
            print("DataFrame rỗng, không thể build index.")
            self.index = faiss.IndexFlatIP(self.embedding_dimension) 
            return

        self.df["embedding"] = (
            self.df["full_text"].astype(str).apply(self.get_embedding)
        )
        self.df.dropna(subset=["embedding"], inplace=True)

        if self.df.empty:
            print("Không có embedding nào được tạo, index sẽ rỗng.")
            self.index = faiss.IndexFlatIP(self.embedding_dimension)
            return

        embeddings = np.array(self.df["embedding"].tolist()).astype("float32")
        faiss.normalize_L2(embeddings)
        self.embedding_dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(self.embedding_dimension)
        self.index.add(embeddings)
        print(f"FAISS index được tạo với {len(self.df)} sản phẩm.")

    def save_cache(self, index_path=SHOP_INDEX_PATH, data_path=SHOP_DATA_PATH):
        try:
            if self.index:
                faiss.write_index(self.index, index_path)
            if not self.df.empty:
                self.df.to_parquet(data_path, index=False, engine='pyarrow')
            print(f"Cache shop đã lưu: {index_path}, {data_path}")
        except Exception as e:
            print(f"Lỗi lưu cache: {e}")

    def load_cache(self, index_path=SHOP_INDEX_PATH, data_path=SHOP_DATA_PATH):
        try:
            if os.path.exists(index_path) and os.path.exists(data_path):
                self.index = faiss.read_index(index_path)
                self.df = pd.read_parquet(data_path, engine='pyarrow')
                self.embedding_dimension = self.index.d
                print(f"Cache shop đã tải ({len(self.df)} sản phẩm).")
                return True
            print("Không tìm thấy cache shop, sẽ build lại từ MongoDB.")
            return False
        except Exception as e:
            print(f"Lỗi tải cache shop: {e}")
            return False

    def get_available_brands(self):
        try:
            db_brands = self.db_collection.distinct("brand", {"brand": {"$ne": None, "$ne": ""}})
            db_brands = [b.lower().strip() for b in db_brands if b]
            
            react_brands = [
                'doggyman', 'goodies', 'orgo', 'smartheart', 'ganador', 'pawise', 
                'natural core', 'anf', 'zenith', 'petq', 'me-o', 'royal canin', 
                'whiskas', 'yu', 'sos', 'absorb plus', 'alkin', 'dorrikey',
                'pedigree', 'pro plan', 'orijen', 'acana'
            ]
            self.available_brands = list(set(db_brands + react_brands))
            print(f"Tải được {len(self.available_brands)} thương hiệu.")
            return self.available_brands
        except Exception as e:
            print(f"Lỗi lấy brands: {e}")
            return []

    def setup(self, start_watcher=False):
        print("Đang khởi tạo ShopRAG...")
        if self.load_cache():
            print("ShopRAG đã tải từ cache!")
        else:
            if not self.load_data():
                print("Không thể tải data shop. Bỏ qua build index.")
                self.index = faiss.IndexFlatIP(self.embedding_dimension) 
            else:
                self.build_index()
                self.save_cache()
        
        self.get_available_brands()
        print("ShopRAG sẵn sàng!")
        
        if start_watcher and self.db_collection is not None:
            self.start_change_stream_watcher()
    
    # === Retrieval: Hybrid Search (Vector + Keyword) ===
    def find_relevant_products(self, query, k=12):
        query_emb = self.get_embedding(query)
        vector_results = pd.DataFrame()

        # ===== 1. VECTOR SEARCH (FAISS) =====
        if query_emb is not None and self.index and self.index.ntotal > 0:
            q_vec = np.array([query_emb], dtype="float32")
            faiss.normalize_L2(q_vec)
            D, I = self.index.search(q_vec, k)
            vector_results = self.df.iloc[I[0]].copy()
            vector_results["score"] = D[0]

        # ===== 2. EXACT NAME BOOST =====
        keyword_results = pd.DataFrame()
        exact_results = pd.DataFrame()
        if not self.df.empty:
            query_lower = query.lower().strip()
            normalized_query = re.sub(r"\s+", " ", query_lower)

            if len(normalized_query) >= 6:
                exact_mask = self.df["name"].str.lower().str.contains(normalized_query, na=False, regex=False)
                if exact_mask.any():
                    exact_results = self.df.loc[exact_mask].copy()
                    exact_results["score"] = 5.0

            keyword_weights = [
                ("royal canin", 3.0), ("pedigree", 2.5), ("ganador", 2.5), ("whiskas", 2.5),
                ("smartheart", 2.5), ("me-o", 2.5), ("anf", 2.0), ("zenith", 2.0),
                ("giường", 1.8), ("ổ", 1.8), ("đệm", 1.8), ("nệm", 1.8), ("chuồng", 1.8),
                ("đồ chơi", 1.8), ("toy", 1.8),
                ("nhà", 1.5), ("vòng cổ", 1.5), ("dây dắt", 1.5), ("balo", 1.5), ("túi", 1.5),
                ("sữa", 1.5), ("sữa bột", 1.5), ("milk", 1.5),
                ("thức ăn", 1.2), ("hạt", 1.2), ("pate", 1.2), ("súp", 1.0), ("bánh thưởng", 1.0),
                ("mèo con", 1.0), ("chó con", 1.0), ("kitten", 1.0), ("puppy", 1.0),
                ("chó", 0.8), ("mèo", 0.8)
            ]

            score_map = {}

            for idx, row in self.df.iterrows():
                name = str(row.get("name", "")).lower()
                tags = (
                    " ".join([str(t).lower() for t in row.get("tags", [])])
                    if isinstance(row.get("tags"), list)
                    else ""
                )
                full_text = str(row.get("full_text", "")).lower()

                for kw, base_weight in keyword_weights:
                    if kw in query_lower:
                        weight_name = base_weight * 1.5
                        weight_desc = base_weight

                        if kw in name or kw in tags:
                            score_map[idx] = score_map.get(idx, 0) + weight_name
                        elif kw in full_text:
                            score_map[idx] = score_map.get(idx, 0) + weight_desc

            if score_map:
                keyword_df = pd.DataFrame(
                    [(idx, score) for idx, score in score_map.items()],
                    columns=["idx", "score"]
                ).sort_values("score", ascending=False)

                keyword_results = self.df.loc[keyword_df["idx"]].copy()
                keyword_results["score"] = keyword_df["score"].values

        final_results = pd.concat(
            [exact_results, keyword_results, vector_results], ignore_index=True
        )

        if not final_results.empty and "score" in final_results.columns:
            final_results = final_results.sort_values(
                by="score", ascending=False, na_position="last"
            )

        final_results = final_results.drop_duplicates(subset=["_id"])

        if len(final_results) > k:
            final_results = final_results.head(max(k, 20))

        if final_results.empty:
            return pd.DataFrame(), []

        return final_results, final_results["score"].tolist()

    def generate_answer(self, query, relevant_data, animal_type=None):
        if relevant_data.empty:
             return "Dạ hiện tại TinyPaws chưa có sản phẩm nào phù hợp với yêu cầu của bạn trong kho ạ."

        context_list = []
        for _, row in relevant_data.iterrows():
            full_desc = str(row.get('description', ''))
            short_desc = full_desc[:200] + "..." if len(full_desc) > 200 else full_desc
            
            price = row.get('price', 0)
            sale_price = row.get('sale_price', 0)
            if sale_price and sale_price > 0 and sale_price < price:
                price_display = f"{sale_price:,}đ (Gốc: {price:,}đ)"
            else:
                price_display = f"{price:,}đ"

            full_text_str = str(row.get('full_text', ''))
            category_info = full_text_str.split('.')[0] if "Loại:" in full_text_str else f"Loại: {row.get('category', 'Sản phẩm')}"

            tags_info = ""
            if 'tags' in row and isinstance(row['tags'], list) and row['tags']:
                tags_info = f" | Tags: {', '.join(row['tags'])}"

            item_str = (
                f"- TÊN SP: {row['name']} | "
                f"{category_info} | "
                f"Giá: {price_display} | "
                f"Kho: {row['stock_quantity']}"
                f"{tags_info} | " 
                f"Mô tả: {short_desc}"
            )
            context_list.append(item_str)
        
        context = "\n".join(context_list)
        
        # --- PROMPT XỬ LÝ LINH HOẠT TỪ ĐỒNG NGHĨA ---
        animal_instruction = ""
        if animal_type:
            animal_instruction = f"""
            🚨 QUY TẮC ĐỐI TƯỢNG ({animal_type.upper()}):
            - Khách hỏi về {animal_type}.
            - Tuy nhiên, hãy hiểu linh hoạt:
              1. Nếu khách hỏi "GIƯỜNG" -> Sản phẩm "Ổ ĐỆM", "NỆM", "NHÀ CÂY" là phù hợp.
              2. Nếu khách hỏi "SỮA" -> Có thể là "Sữa bột" (Thức ăn) hoặc "Sữa tắm" (Vệ sinh). Hãy giới thiệu cả hai nếu có.
              3. Phụ kiện (Vòng cổ, Balo, Túi) -> Thường dùng chung cho chó mèo, hãy giới thiệu.
            - ĐỪNG trả lời "không có" nếu tên sản phẩm khác một chút (ví dụ "Ổ" thay vì "Giường") nhưng công dụng giống nhau.
            """

        prompt = f"""
        Bạn là nhân viên bán hàng của TinyPaws.
        
        KHO HÀNG CÓ SẴN (Chỉ bán những gì có trong list này):
        ---------------------
        {context}
        ---------------------

        CÂU HỎI: "{query}"
        {animal_instruction}

        YÊU CẦU TRẢ LỜI:
        1. Dựa vào danh sách trên, tìm sản phẩm phù hợp nhất với ý định của khách (Thức ăn, Giường, Sữa, Dây dắt...).
        2. Nếu tìm thấy sản phẩm có tên hoặc công dụng tương đương (VD: Khách tìm 'Giường' mà kho có 'Ổ đệm'), HÃY GIỚI THIỆU.
        3. Nếu tìm thấy "Sữa", hãy nói rõ là sữa tắm hay sữa uống.
        4. Chỉ trả lời "Không có" khi danh sách trống rỗng.
        5. KHÔNG dùng icon 🐾.
        """
        
        return self.llm_generate_with_retry(prompt, max_retries=2)

    def chat(self, query, history=None, k=12):
        start = time.time()
        query_lower = query.lower()
        import re

        # ========== 1. SUPPORT ==========
        if any(k in query_lower for k in [
            "gặp nhân viên", "chat với admin", "tư vấn trực tiếp",
            "khiếu nại", "đơn hàng", "bom hàng", "liên hệ shop"
        ]):
            return {
                "response": "Dạ vấn đề này cần nhân viên hỗ trợ trực tiếp ạ. Bạn vui lòng nhấn **Liên hệ nhân viên** bên dưới nhé!",
                "sources": [],
                "fallback": True,
                "processing_time": 0,
                "max_similarity": 1.0
            }

        # ========== 2. GENERAL INFO ==========
        if "giờ" in query_lower:
            return {"response": "TinyPaws mở cửa từ 9:00 đến 21:00 mỗi ngày ạ.", "sources": [], "fallback": False, "max_similarity": 1.0}
        if "địa chỉ" in query_lower:
            return {"response": "TinyPaws ở Lạc Long Quân, Điện Dương, Điện Bàn, Quảng Nam ạ.", "sources": [], "fallback": False, "max_similarity": 1.0}
        if "sđt" in query_lower or "số điện thoại" in query_lower:
            return {"response": "Hotline TinyPaws: 0765 234 567 ạ.", "sources": [], "fallback": False, "max_similarity": 1.0}

        # ========== 3. INTENT DETECTION ==========
        def detect_intent(q):
            if "sữa" in q:
                if any(k in q for k in ["bột", "uống", "ăn", "dinh dưỡng", "mèo con", "kitten"]):
                    return "MILK_DRINK"
                return "MILK_CARE"

            if any(k in q for k in ["đồ chơi", "toy", "cần câu", "bóng", "cá giả"]):
                return "TOY"

            if any(k in q for k in ["vòng cổ", "dây dắt", "balo", "túi", "giường", "ổ", "nệm"]):
                return "ACCESSORY"

            if any(k in q for k in ["cát", "thảm", "vệ sinh", "khay"]):
                return "HYGIENE"

            if any(k in q for k in ["hạt", "pate", "thức ăn", "bánh thưởng"]):
                return "FOOD"

            return "GENERAL"

        intent = detect_intent(query_lower)

        # ========== 4. CONTEXT QUERY ==========
        context_query = query_lower
        if history:
            recent = " ".join(h["content"] for h in history[-5:] if h["role"] == "user")
            context_query = f"{recent} {query_lower}".lower()

        # ========== 5. RETRIEVAL ==========
        relevant, scores = self.find_relevant_products(context_query, k)
        max_score = float(max(scores)) if scores else 0.0

        # ========== 6. INTENT FILTER ==========
        if not relevant.empty:

            def match_intent(row):
                text = f"{row.get('name','')} {row.get('description','')} {row.get('full_text','')}".lower()

                if intent == "MILK_DRINK":
                    return "sữa" in text and not any(k in text for k in ["tắm", "dầu gội", "vệ sinh"])

                if intent == "MILK_CARE":
                    return any(k in text for k in ["sữa", "tắm", "dầu gội"])

                if intent == "ACCESSORY":
                    return any(k in text for k in [
                        "vòng cổ", "dây dắt", "balo", "túi", "giường", "ổ", "nệm"
                    ])

                if intent == "TOY":
                    return any(k in text for k in ["đồ chơi", "toy", "cần câu", "bóng", "cá giả", "interactive"])

                if intent == "HYGIENE":
                    return any(k in text for k in ["cát", "thảm", "vệ sinh", "khay"])

                if intent == "FOOD":
                    return any(k in text for k in ["hạt", "pate", "thức ăn", "bánh"])

                return True

            filtered = relevant[relevant.apply(match_intent, axis=1)]
            if not filtered.empty:
                relevant = filtered

        # ========== 7. EMPTY HANDLING ==========
        if relevant.empty or max_score < self.similarity_threshold:
            intent_msg = {
                "MILK_DRINK": "Dạ hiện tại TinyPaws **chưa có sữa bột dinh dưỡng cho mèo con** ạ.",
                "MILK_CARE": "Dạ hiện tại bên em chưa có sản phẩm sữa tắm phù hợp ạ.",
                "ACCESSORY": "Dạ hiện tại bên em chưa có phụ kiện đúng loại bạn cần ạ.",
                "TOY": "Dạ hiện tại bên em chưa có đồ chơi đúng yêu cầu bạn hỏi ạ.",
                "HYGIENE": "Dạ hiện tại bên em chưa có sản phẩm vệ sinh phù hợp ạ.",
                "FOOD": "Dạ hiện tại bên em chưa có loại thức ăn này trong kho ạ."
            }

            return {
                "response": intent_msg.get(intent, "Dạ hiện tại bên em chưa có sản phẩm phù hợp ạ."),
                "sources": [],
                "fallback": False,
                "processing_time": round(time.time() - start, 2),
                "max_similarity": max_score
            }

        # ========== 8. FINAL ANSWER ==========
        animal_type = None
        if re.search(r'\b(mèo|meo|cat|kitten)\b', context_query): animal_type = "Mèo"
        elif re.search(r'\b(chó|cho|dog|puppy)\b', context_query): animal_type = "Chó"

        answer = self.generate_answer(query, relevant, animal_type)
        docs = relevant[["_id", "name", "description", "price", "stock_quantity"]].to_dict("records")

        return {
            "response": answer,
            "sources": docs,
            "fallback": False,
            "processing_time": round(time.time() - start, 2),
            "max_similarity": max_score
        }

    def reload_index(self):
        """Hàm này được gọi khi có thay đổi trong DB"""
        print("Phát hiện thay đổi MongoDB! Đang build lại index...")
        if self.load_data():
            self.build_index()
            self.save_cache()
            self.get_available_brands() 
            print("Index shop đã được cập nhật.")
    
    def start_change_stream_watcher(self):
        print("Theo dõi thay đổi MongoDB (auto reload)...")
        if self.db_collection is None: return

        try:
            self.db_client.admin.command('hello')
            print("Change Streams được hỗ trợ.")
        except:
            print("Change Streams không hỗ trợ. Dùng polling.")
            self.start_polling_watcher() 
            return

        def watch_changes():
            try:
                with self.db_collection.watch(full_document='updateLookup') as stream:
                    for change in stream:
                        if change['operationType'] in ['insert', 'update', 'replace', 'delete']:
                            self.reload_index()
            except: self.start_polling_watcher()

        Thread(target=watch_changes, daemon=True).start()
    
    def start_polling_watcher(self):
        def poll_changes():
            last_count = self.db_collection.count_documents({})
            while True:
                try:
                    time.sleep(60)
                    current_count = self.db_collection.count_documents({})
                    if current_count != last_count:
                        self.reload_index()
                        last_count = current_count
                except: time.sleep(60)
        
        Thread(target=poll_changes, daemon=True).start()