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

# === SỬA LỖI ĐƯỜNG DẪN ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHOP_INDEX_PATH = os.path.join(BASE_DIR, "shop_faiss.bin")
SHOP_DATA_PATH = os.path.join(BASE_DIR, "shop_cache.parquet")
# ========================


class ShopRAGMongo:
    def __init__(self, api_key, mongo_uri, db_name="TINYPAWS", collection="products", categories_collection="categories"):
        self.api_key = api_key
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.collection_name = collection
        self.categories_collection_name = categories_collection # Lưu tên bảng category
        self.embedding_model_name = "models/text-embedding-004"
        
        self.df = pd.DataFrame()
        self.index = None
        self.llm_model = None
        self.db_client = None
        self.db_collection = None
        self.embedding_dimension = 768
        self.similarity_threshold = 0.45 # Có thể giảm xuống 0.5 nếu muốn tìm rộng hơn

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")
        
        try:
            self.db_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            self.db_collection = self.db_client[db_name][collection]
            print(f"Kết nối MongoDB thành công: {db_name}.{collection}")
        except Exception as e:
            print(f"Lỗi kết nối MongoDB: {e}")
            self.db_client = None

        self.available_brands = []  # ⭐ Thêm cache brands
        
    # === Lấy danh sách Categories về làm từ điển ===
    def get_category_map(self):
        """Tạo từ điển {ID: Tên Danh Mục}"""
        try:
            cat_coll = self.db_client[self.db_name][self.categories_collection_name]
            # Chỉ lấy _id và name để tiết kiệm bộ nhớ
            cursor = cat_coll.find({}, {"_id": 1, "name": 1})
            
            # Map: "68f91e..." -> "Thức ăn"
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
            # Bước 1: Lấy từ điển danh mục
            cat_map = self.get_category_map()
            print(f"Đã tải {len(cat_map)} danh mục để tham chiếu.")

            # 🔥 SỬA 1: THÊM "tags" VÀO PROJECTION
            projection = {
                "name": 1, "description": 1, "price": 1, 
                "sale_price": 1, "stock_quantity": 1, "category": 1, 
                "brand": 1, "tags": 1  # <--- QUAN TRỌNG: LẤY TRƯỜNG TAGS
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

            # 🔥 SỬA 2: Xử lý Tags (đảm bảo là list)
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
                
                # 🔥 SỬA 3: BIẾN TAGS THÀNH CHUỖI VĂN BẢN
                # Ví dụ: tags = ["mèo sỏi thận", "tiết niệu"] -> tags_str = "mèo sỏi thận, tiết niệu"
                tags_data = row.get('tags', [])
                if isinstance(tags_data, list):
                    tags_str = ", ".join([str(t) for t in tags_data])
                else:
                    tags_str = str(tags_data)
                
                # Nhồi tags vào chuỗi full_text để AI "đọc" được
                return (
                    f"Từ khóa tags: {tags_str}. "  # <--- ĐƯA TAGS LÊN ĐẦU ĐỂ ƯU TIÊN
                    f"Thương hiệu: {brand_name}. "
                    f"Loại: {cat_name}. "
                    f"Tên: {row['name']}. "
                    f"Mô tả: {row.get('description', '')}. "
                    f"Giá: {price_str} VND. "
                    f"Kho: {row.get('stock_quantity', 0)}"
                )

            self.df["full_text"] = self.df.apply(create_full_text, axis=1)
            return True

        except Exception as e:
            print(f"Lỗi load data: {e}")
            return False
    
    # === Embedding ===
    def get_embedding(self, text):
        try:
            result = genai.embed_content(model=self.embedding_model_name, content=text)
            return result["embedding"]
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None

    # === Retry wrapper for LLM ===
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


    # === Build FAISS index (Cosine) ===
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

    # === Cache ===
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
        """Lấy danh sách thương hiệu từ DB + Danh sách cứng (Sync với React)"""
        try:
            # 1. Lấy từ DB
            db_brands = self.db_collection.distinct("brand", {"brand": {"$ne": None, "$ne": ""}})
            db_brands = [b.lower().strip() for b in db_brands if b]
            
            # 2. 🔥 SỬA: Danh sách cứng (giống brandOptions trong React)
            # Để đảm bảo dù DB chưa cập nhật, Bot vẫn biết Shop CÓ kinh doanh hãng này
            react_brands = [
                'doggyman', 'goodies', 'orgo', 'smartheart', 'ganador', 'pawise', 
                'natural core', 'anf', 'zenith', 'petq', 'me-o', 'royal canin', 
                'whiskas', 'yu', 'sos', 'absorb plus', 'alkin', 'dorrikey',
                'pedigree', 'pro plan', 'orijen', 'acana' # Thêm các hãng khác nếu cần
            ]
            
            # Gộp lại và loại bỏ trùng lặp
            self.available_brands = list(set(db_brands + react_brands))
            
            print(f"📦 Tải được {len(self.available_brands)} thương hiệu.")
            return self.available_brands
        except Exception as e:
            print(f"Lỗi lấy brands: {e}")
            return []

    # === Setup ===
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
        
        # ⭐ Load danh sách brands
        self.get_available_brands()
        
        print("ShopRAG sẵn sàng!")
        
        if start_watcher and self.db_collection is not None:
            self.start_change_stream_watcher()
    
    # === Retrieval: Hybrid Search (Vector + Keyword) ===
    def find_relevant_products(self, query, k=8):
        query_emb = self.get_embedding(query)
        vector_results = pd.DataFrame()
        
        if query_emb is not None and self.index and self.index.ntotal > 0:
            q_vec = np.array([query_emb], dtype="float32")
            faiss.normalize_L2(q_vec)
            D, I = self.index.search(q_vec, k)
            vector_results = self.df.iloc[I[0]].copy()
            vector_results["score"] = D[0]

        keyword_results = pd.DataFrame()
        if not self.df.empty:
            query_lower = query.lower()
            
            # 🔥 THÊM TÊN THƯƠNG HIỆU VÀO DANH SÁCH QUAN TRỌNG
            important_keywords = [
                # Bệnh lý
                "sỏi thận", "thận", "tiết niệu", "urinary","triệt sản", "bầu", "mang thai",
                # Độ tuổi
                "mèo con", "chó con", "kitten", "puppy",
                # Giống loài
                "poodle", "golden", "corgi", "husky", "beagle", "persian", "scottish",
                # Thương hiệu (⭐ THÊM MỚI)
                "royal canin", "ganador", "whiskas", "pedigree",
                "anf", "a.n.f", "advance", "pro plan", "proplan",
                "taste of the wild", "orijen", "acana", "farmina",
                "petq", "smartheart", "doggyman", "cat's eye",
                # Động vật
                "chó", "mèo", "dog", "cat"
            ]
            
            matched_indices = set()
            for kw in important_keywords:
                if kw in query_lower:
                    matches = self.df[self.df["full_text"].str.contains(kw, case=False, na=False)]
                    if not matches.empty:
                        matched_indices.update(matches.index.tolist())
                        print(f"🔍 Tìm thấy {len(matches)} sản phẩm có từ khóa '{kw}'")

            if matched_indices:
                keyword_results = self.df.loc[list(matched_indices)].copy()
                keyword_results["score"] = 1.0

        final_results = pd.concat([keyword_results, vector_results])
        final_results = final_results.drop_duplicates(subset=["_id"])
        final_results = final_results.head(k)
        
        if final_results.empty:
             return pd.DataFrame(), []
             
        return final_results, final_results["score"].tolist()

    # === Generation ===
    # === Generation (Đã sửa Prompt cực đoan & Tags) ===
    def generate_answer(self, query, relevant_data, animal_type=None):
        # 1. KIỂM TRA RỖNG TUYỆT ĐỐI
        if relevant_data.empty:
             return "Dạ hiện tại TinyPaws chưa có sản phẩm nào phù hợp với yêu cầu của bạn trong kho ạ."

        context_list = []
        for _, row in relevant_data.iterrows():
            full_desc = str(row.get('description', ''))
            short_desc = full_desc[:200] + "..." if len(full_desc) > 200 else full_desc
            
            # --- 🔥 LOGIC GIÁ MỚI: Ưu tiên Sale Price ---
            price = row.get('price', 0)
            sale_price = row.get('sale_price', 0)
            
            # Logic hiển thị: Nếu có giá sale và giá sale < giá gốc
            if sale_price and sale_price > 0 and sale_price < price:
                price_display = f"{sale_price:,}đ (Gốc: {price:,}đ)"
            else:
                price_display = f"{price:,}đ"
            # -------------------------------------------

            full_text_str = str(row.get('full_text', ''))
            category_info = full_text_str.split('.')[0] if "Loại:" in full_text_str else f"Loại: {row.get('category', 'Sản phẩm')}"

            tags_info = ""
            if 'tags' in row and isinstance(row['tags'], list) and row['tags']:
                tags_info = f" | Tags công dụng: {', '.join(row['tags'])}"

            item_str = (
                f"- SẢN PHẨM: {row['name']} | "
                f"{category_info} | "
                f"Giá: {price_display} | "  # <-- Dùng biến price_display đã xử lý
                f"Kho: {row['stock_quantity']}"
                f"{tags_info} | " 
                f"Mô tả: {short_desc}"
            )
            context_list.append(item_str)
        
        context = "\n".join(context_list)
        
        # --- LOGIC FILTER ĐỘNG VẬT ---
        animal_instruction = ""
        if animal_type:
            animal_instruction = f"""
            🚨 YÊU CẦU VỀ ĐỘNG VẬT:
            - Khách hỏi về: {animal_type.upper()}.
            - CHỈ giới thiệu sản phẩm dành cho {animal_type}.
            - Nếu sản phẩm trong danh sách là dành cho loài khác -> Trả lời: "Hiện shop chưa có sản phẩm {animal_type} của hãng này."
            """

        # --- PROMPT ĐÃ ĐƯỢC SIẾT CHẶT ---
        prompt = f"""
        Bạn là nhân viên kho của TinyPaws. Bạn KHÔNG PHẢI là bác sĩ thú y.
        
        DỮ LIỆU KHO HÀNG THỰC TẾ (Chỉ được trả lời dựa trên list này):
        ---------------------
        {context}
        ---------------------

        CÂU HỎI: "{query}"
        {animal_instruction}

        QUY TẮC TRẢ LỜI (BẮT BUỘC TUÂN THỦ):
        1. CHỈ giới thiệu sản phẩm có trong danh sách trên.

        2. NẾU KHÁCH HỎI VỀ CHÍNH SÁCH/SO SÁNH GIÁ (không hỏi mua cụ thể):
           - Chỉ giải thích về chất lượng, cam kết chính hãng.
           - KHÔNG tự ý liệt kê danh sách sản phẩm nếu khách chưa yêu cầu.
        
        3. NẾU KHÔNG CÓ SẢN PHẨM TRONG DANH SÁCH: 
           - Trả lời thẳng: "Dạ shop hiện chưa kinh doanh mặt hàng này ạ."
           - TUYỆT ĐỐI KHÔNG nhắc đến tên các loại thuốc/sản phẩm bên ngoài (như Nexgard, Bravecto, Frontline...) nếu chúng không có trong kho.
           - KHÔNG tự ý bịa ra lời khuyên y tế.

        4. VỚI CÂU HỎI VỀ BỆNH LÝ (sỏi thận, ve rận, rụng lông...):
           - Nếu có sản phẩm hỗ trợ trong kho (check Tags/Mô tả) -> Giới thiệu sản phẩm đó.
           - LUÔN KẾT THÚC bằng câu: "Bạn nhớ tham khảo ý kiến bác sĩ thú y để đảm bảo an toàn và hiệu quả nhé!" (KHÔNG dùng icon).
           
        5. KHÔNG dùng biểu tượng 🐾 trong câu trả lời.
        6. Trả lời ngắn gọn, tập trung vào giá và tồn kho.
        """
        
        return self.llm_generate_with_retry(prompt, max_retries=2)

    def chat(self, query, history=None, k=8):
        start = time.time()
        query_lower = query.lower()
        import re 

        # --- 1. BỘ LỌC Ý ĐỊNH GẶP NHÂN VIÊN / KHIẾU NẠI (QUAN TRỌNG) ---
        support_keywords = [
            "gặp nhân viên", "nói chuyện với người", "chat với admin", "tư vấn trực tiếp",
            "gặp tư vấn viên", "gặp người thật", "khiếu nại", "đơn hàng", "bom hàng",
            "hoàn tiền", "đổi trả", "ship lâu", "chưa nhận được", "giao sai", "giao chưa",
            "nhân viên hỗ trợ", "liên hệ shop", "alo shop", "chủ shop", "gặp admin"
        ]
        
        for kw in support_keywords:
            if kw in query_lower:
                return {
                    "response": "Dạ vấn đề này cần nhân viên hỗ trợ trực tiếp ạ. Bạn vui lòng nhấn nút **'Liên hệ nhân viên hỗ trợ'** bên dưới để chat với Admin nhé! 👇",
                    "sources": [],
                    "fallback": True, # ⭐ QUAN TRỌNG: Phải return True
                    "processing_time": round(time.time() - start, 2),
                    "max_similarity": 1.0
                }

        # --- 2. XỬ LÝ CÂU HỎI THÔNG TIN CHUNG & NHẠY CẢM ---
        general_info = {
            "giờ": "TinyPaws mở cửa từ 9:00 sáng đến 9:00 tối tất cả các ngày trong tuần!",
            "mở cửa": "TinyPaws mở cửa từ 9:00 sáng đến 9:00 tối tất cả các ngày trong tuần!",
            "địa chỉ": "TinyPaws có địa chỉ tại: Lạc Long Quân, Điện Dương, Điện Bàn, Quảng Nam nha!",
            "ở đâu": "TinyPaws có địa chỉ tại: Lạc Long Quân, Điện Dương, Điện Bàn, Quảng Nam nha!",
            "sđt": "Hotline của shop là: 0765234567.",
            "điện thoại": "Hotline của shop là: 0765234567.",

            "lừa đảo": "TinyPaws cam kết là cửa hàng uy tín, có địa chỉ rõ ràng và giấy phép kinh doanh đầy đủ. Bạn có thể ghé trực tiếp shop tại Quảng Nam để kiểm tra hàng nha!",
            "uy tín": "TinyPaws luôn đặt uy tín lên hàng đầu với cam kết hàng chính hãng 100%, date mới và chính sách đổi trả rõ ràng!",
            "có thật không": "TinyPaws là shop thật 100% ạ! Bạn có thể xem đánh giá trên Fanpage hoặc ghé trực tiếp cửa hàng nhé.",

            "đắt": "Dạ 'Tiền nào của nấy' ạ. TinyPaws cam kết chỉ bán hàng Chính Hãng, nguồn gốc rõ ràng và được bảo quản trong môi trường máy lạnh 24/7 để đảm bảo dinh dưỡng tốt nhất cho bé. Rẻ hơn chút nhưng rủi ro hàng giả/kém chất lượng thì tội bé lắm ạ!",
            "rẻ hơn": "Dạ giá bên em luôn đi kèm với cam kết Chất Lượng & Hậu Mãi. Hàng tại TinyPaws là hàng công ty chính ngạch, date xa và được bảo hành đổi trả nếu có lỗi của nhà sản xuất.",
            "tại sao": "Dạ giá sản phẩm phụ thuộc vào nguồn nhập và quy trình bảo quản ạ. TinyPaws cam kết hàng chuẩn Auth, không bán hàng trôi nổi để đảm bảo sức khỏe cho các bé!"
        }
        
        for key, answer in general_info.items():
            if key in query_lower:
                if key == "tại sao" and "đắt" not in query_lower and "giá" not in query_lower:
                    continue 
                return { "response": answer, "sources": [], "fallback": False, "processing_time": 0, "max_similarity": 1.0 }

        # --- 3. XỬ LÝ NGỮ CẢNH LỊCH SỬ ---
        context_query = query_lower
        recent_history = []
        if history and len(history) > 0:
            recent_history = history[-6:] 
            recent_user_turns = [item["content"] for item in recent_history if item["role"] == "user"]
            if recent_user_turns:
                full_context = " ".join(recent_user_turns) + " " + query_lower
                context_query = full_context.lower()

        # Phát hiện động vật
        animal_type = None
        meo_pattern = r'\b(mèo|meo|cat|kitten)\b'
        cho_pattern = r'\b(chó|cho|dog|puppy|poodle|golden|corgi|husky|beagle)\b'
        
        if re.search(meo_pattern, context_query):
            animal_type = "Mèo"
        elif re.search(cho_pattern, context_query):
            if "mèo" not in context_query and "meo" not in context_query:
                animal_type = "Chó"

        # --- 4. TÌM KIẾM VÀ LỌC (RAG) ---
        relevant, scores = self.find_relevant_products(context_query, k)
        max_score = float(max(scores)) if len(scores) else 0.0
        
        GREETING_KEYWORDS = ["hi", "hello", "chào", "alo", "ơi", "bot", "shop", "ad", "admin", "hỗ trợ"]
        is_greeting = any(kw in query_lower for kw in GREETING_KEYWORDS)

        if not relevant.empty:
            # --- A. BỘ LỌC DANH MỤC CỨNG ---
            category_rules = {
                "đồ chơi": ["Đồ chơi", "Phụ kiện", "Dụng cụ"],
                "nhà cây": ["Đồ chơi", "Phụ kiện", "Chuồng"],
                "cat tree": ["Đồ chơi", "Phụ kiện"],
                "thức ăn": ["Thức ăn", "Hạt", "Pate", "Bánh thưởng", "Súp"],
                "hạt": ["Thức ăn", "Hạt"],
                "pate": ["Thức ăn", "Pate"],
                "bánh thưởng": ["Thức ăn", "Bánh thưởng"],
                "thuốc": ["Thuốc", "Y tế", "Chăm sóc sức khỏe", "Dinh dưỡng"],
                "trị ve": ["Thuốc", "Y tế", "Chăm sóc sức khỏe", "Vệ sinh"],
                "sữa tắm": ["Vệ sinh", "Mỹ phẩm"],
                "cát": ["Vệ sinh", "Cát vệ sinh"]
            }
            
            detected_categories = []
            for keyword, valid_cats in category_rules.items():
                if keyword in query_lower:
                    detected_categories.extend(valid_cats)
            
            if detected_categories:
                def check_category_match(row):
                    full_txt = str(row.get('full_text', '')).lower()
                    cat_col = str(row.get('category', '')).lower()
                    return any(t.lower() in cat_col or f"loại: {t.lower()}" in full_txt for t in detected_categories)

                filtered_relevant = relevant[relevant.apply(check_category_match, axis=1)]
                
                if not filtered_relevant.empty or "thuốc" in query_lower or "trị ve" in query_lower:
                    relevant = filtered_relevant

        if not relevant.empty:
            # --- B. BỘ LỌC THƯƠNG HIỆU ---
            brand_mapping = {
                "anf": ["anf", "a.n.f"], "royal canin": ["royal canin", "royal", "canin"],
                "ganador": ["ganador"], "whiskas": ["whiskas"], "pedigree": ["pedigree"],
                "pro plan": ["pro plan", "proplan"], "doggyman": ["doggyman"],
                "smartheart": ["smartheart"], "me-o": ["me-o", "meo"], "petq": ["petq"]
            }
            
            detected_brand_key = None
            for brand_key, aliases in brand_mapping.items():
                for alias in aliases:
                    if re.search(r'\b' + re.escape(alias) + r'\b', context_query, re.IGNORECASE):
                        detected_brand_key = brand_key
                        break
                if detected_brand_key: break
            
            if detected_brand_key:
                brand_in_db = detected_brand_key in self.available_brands
                if not brand_in_db:
                      return { "response": f"Xin lỗi, hiện TinyPaws chưa có sản phẩm thương hiệu **{detected_brand_key.upper()}** trong kho.", "sources": [], "fallback": True, "processing_time": 0, "max_similarity": 0.0 }
                
                brand_filtered = relevant[relevant["full_text"].str.contains(detected_brand_key, case=False, na=False)]
                if not brand_filtered.empty:
                    relevant = brand_filtered
                else:
                    return { "response": f"Sản phẩm thương hiệu **{detected_brand_key.upper()}** hiện đang hết hàng ạ.", "sources": [], "fallback": True, "processing_time": 0, "max_similarity": 0.0 }

        # --- 5. KIỂM TRA KẾT QUẢ CUỐI CÙNG ---
        if relevant.empty or max_score < self.similarity_threshold:
            if is_greeting:
                greeting_prompt = f"""
                Người dùng: "{query}"
                Bạn là trợ lý của TinyPaws. Hãy chào thân thiện và giới thiệu shop có bán thức ăn, phụ kiện, đồ chơi cho thú cưng.
                """
                return { "response": self.llm_generate_with_retry(greeting_prompt), "sources": [], "fallback": False, "processing_time": round(time.time() - start, 2), "max_similarity": max_score }

            # 🔥 QUAN TRỌNG: Nếu tìm nát nước vẫn không ra sản phẩm -> Gợi ý gặp Admin
            return {
                "response": "Dạ em tìm trong kho thì chưa thấy thông tin phù hợp ạ. 😿\nBạn có muốn **chat trực tiếp với nhân viên** để được tư vấn kỹ hơn không?",
                "sources": [],
                "fallback": True, # <-- Bật cờ fallback để hiện nút
                "processing_time": round(time.time() - start, 2),
                "max_similarity": max_score
            }

        # --- 6. TẠO CÂU TRẢ LỜI ---
        answer = self.generate_answer(query, relevant, animal_type)
        docs = relevant[["_id", "name", "description", "price", "stock_quantity"]].replace({np.nan: None}).to_dict("records")

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
        if self.db_collection is None:
            print("Không thể theo dõi, chưa kết nối MongoDB.")
            return

        try:
            self.db_client.admin.command('hello')
            server_info = self.db_client.server_info()
            version = server_info.get('version', '0.0.0')
            
            print("Change Streams được hỗ trợ.")
        except Exception as e:
            print(f"Change Streams không được hỗ trợ: {e}. Sử dụng polling thay thế.")
            self.start_polling_watcher() 
            return

        def watch_changes():
            try:
                with self.db_collection.watch(full_document='updateLookup') as stream:
                    for change in stream:
                        print(f"MongoDB change detected: {change['operationType']}")
                        if change['operationType'] in ['insert', 'update', 'replace', 'delete']:
                            self.reload_index()
            except Exception as e:
                print(f"Lỗi Change Stream watcher: {e}")
                print("Chuyển sang polling mode...")
                self.start_polling_watcher()

        watcher_thread = Thread(target=watch_changes, daemon=True)
        watcher_thread.start()
        print("Watcher thread started (Change Stream supported).")
    
    # THÊM POLLING WATCHER (cho MongoDB local)
    def start_polling_watcher(self):
        """
        Kiểm tra số lượng sản phẩm mỗi 60 giây.
        Nếu có thay đổi → Rebuild index.
        """
        import threading
        
        def poll_changes():
            last_count = self.db_collection.count_documents({})
            print(f"Bắt đầu polling (hiện có {last_count} sản phẩm)")
            
            while True:
                try:
                    time.sleep(60)  # Kiểm tra mỗi 60 giây
                    current_count = self.db_collection.count_documents({})
                    
                    if current_count != last_count:
                        print(f"Phát hiện thay đổi: {last_count} → {current_count} sản phẩm")
                        print("Đang rebuild index...")
                        self.reload_index()
                        last_count = current_count
                        print("Rebuild hoàn tất!")
                        
                except Exception as e:
                    print(f"Lỗi polling: {e}")
                    time.sleep(60)
        
        poll_thread = threading.Thread(target=poll_changes, daemon=True)
        poll_thread.start()
        print("Polling watcher started (kiểm tra mỗi 60 giây)")