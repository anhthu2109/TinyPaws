# -*- coding: utf-8 -*-
import os
import time
import faiss
import numpy as np
import pandas as pd
import google.generativeai as genai
import unicodedata
from pymongo import MongoClient, errors
from threading import Thread

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
        self.similarity_threshold = 0.55 # Có thể giảm xuống 0.5 nếu muốn tìm rộng hơn

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")
        
        try:
            self.db_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            self.db_collection = self.db_client[db_name][collection]
            print(f"Kết nối MongoDB thành công: {db_name}.{collection}")
        except Exception as e:
            print(f"Lỗi kết nối MongoDB: {e}")
            self.db_client = None

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
            # Bước 1: Lấy từ điển danh mục về trước
            cat_map = self.get_category_map()
            print(f"Đã tải {len(cat_map)} danh mục để tham chiếu.")

            # Bước 2: Lấy sản phẩm (Lấy cả cột category)
            # Lưu ý: dùng stock_quantity theo đúng DB của bạn
            projection = {
                "name": 1, "description": 1, "price": 1, 
                "sale_price": 1, "stock_quantity": 1, "category": 1
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
            
            # Bước 3: Tạo hàm xử lý từng dòng để gắn Tên Danh Mục vào
            def create_full_text(row):
                # Xử lý giá
                price_str = f"{row.get('price', 0)}"
                if row.get('sale_price') and row.get('sale_price') > 0:
                    price_str = f"{row['sale_price']} (Gốc: {row['price']})"
                
                # --- QUAN TRỌNG: LOOKUP CATEGORY ---
                # Lấy ID category từ sản phẩm
                cat_id = str(row.get('category', ''))
                # Tra cứu trong từ điển. Nếu không thấy thì để là "Sản phẩm"
                cat_name = cat_map.get(cat_id, "Sản phẩm")
                # -----------------------------------

                # Ghép chuỗi thông minh: Đưa Tên Danh Mục lên đầu
                return (
                    f"Loại: {cat_name}. "  # <-- AI sẽ nhìn thấy chữ "Thức ăn" ở đây
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
            
        print("ShopRAG sẵn sàng!")
        
        if start_watcher and self.db_collection is not None:
            self.start_change_stream_watcher()
    
    # === Retrieval: Hybrid Search (Vector + Keyword) ===
    def find_relevant_products(self, query, k=8):
        # 1. Tìm kiếm bằng Vector (Cũ)
        query_emb = self.get_embedding(query)
        vector_results = pd.DataFrame()
        
        if query_emb is not None and self.index and self.index.ntotal > 0:
            q_vec = np.array([query_emb], dtype="float32")
            faiss.normalize_L2(q_vec)
            D, I = self.index.search(q_vec, k)
            vector_results = self.df.iloc[I[0]].copy()
            # Gán điểm giả lập cho vector search
            vector_results["score"] = D[0]

        # 2. Tìm kiếm bằng Từ khóa (Mới - Keyword Search)
        # Mục đích: Bắt dính các từ chuyên môn như "sỏi thận", "triệt sản", "royal canin"...
        keyword_results = pd.DataFrame()
        if not self.df.empty:
            query_lower = query.lower()
            # Tách câu hỏi thành các từ quan trọng (bỏ qua các từ vô nghĩa nếu muốn)
            # Ở đây ta tìm các dòng mà cột full_text chứa cụm từ người dùng hỏi
            # Ví dụ: Nếu hỏi "sỏi thận", lọc tất cả sp có chữ "sỏi thận"
            
            # Định nghĩa các từ khóa "bắt buộc phải có" nếu xuất hiện
            important_keywords = ["sỏi thận", "thận", "triệt sản", "bầu", "mang thai", "mèo con", "royal canin", "ganador"]
            
            matched_indices = set()
            for kw in important_keywords:
                if kw in query_lower:
                    # Tìm các dòng chứa từ khóa này
                    matches = self.df[self.df["full_text"].str.contains(kw, case=False, na=False)]
                    if not matches.empty:
                        matched_indices.update(matches.index.tolist())

            if matched_indices:
                keyword_results = self.df.loc[list(matched_indices)].copy()
                keyword_results["score"] = 1.0 # Gán điểm cao nhất cho kết quả khớp từ khóa

        # 3. Gộp kết quả (Merge)
        # Ưu tiên Keyword Search lên đầu, sau đó đến Vector Search
        final_results = pd.concat([keyword_results, vector_results])
        
        # Loại bỏ trùng lặp (dựa trên _id)
        final_results = final_results.drop_duplicates(subset=["_id"])
        
        # Lấy Top K (Nếu keyword tìm ra ít thì bù bằng vector, nếu nhiều thì lấy hết keyword trước)
        final_results = final_results.head(k)
        
        if final_results.empty:
             return pd.DataFrame(), []
             
        return final_results, final_results["score"].tolist()

    # === Generation ===
    def generate_answer(self, query, relevant_data):
        if relevant_data.empty:
             return self.llm_generate_with_retry(f"Bạn là trợ lý của TinyPaws. Hiện không tìm thấy sản phẩm nào khớp với: '{query}'. Hãy mời khách xem các danh mục khác.")

        # --- XỬ LÝ DỮ LIỆU TRƯỚC KHI GỬI AI (QUAN TRỌNG) ---
        context_list = []
        for _, row in relevant_data.iterrows():
            # 1. Cắt ngắn mô tả: Chỉ lấy 200 ký tự đầu tiên để tránh lỗi 429
            full_desc = str(row.get('description', ''))
            short_desc = full_desc[:200] + "..." if len(full_desc) > 200 else full_desc
            
            # 2. Lấy thông tin loại từ full_text hoặc cột category (đã map)
            # Tách lấy phần "Loại: ..." trong full_text để AI dễ phân biệt
            full_text_str = str(row.get('full_text', ''))
            category_info = full_text_str.split('.')[0] if "Loại:" in full_text_str else f"Loại: {row.get('category', 'Sản phẩm')}"

            # 3. Tạo chuỗi thông tin gọn nhẹ
            item_str = (
                f"{category_info} | "
                f"Tên: {row['name']} | "
                f"Giá: {row['price']} | "
                f"Kho: {row['stock_quantity']} | "
                f"Mô tả: {short_desc}"
            )
            context_list.append(item_str)
        
        context = "\n".join(context_list)
        # ----------------------------------------------------
        
        prompt = f"""
        Bạn là nhân viên TinyPaws. Dưới đây là danh sách sản phẩm tìm được trong kho:
        {context}

        Câu hỏi của khách: "{query}"

        Nhiệm vụ:
        1. LỌC SẢN PHẨM:
           - Nếu khách hỏi "Mèo", hãy ƯU TIÊN các sản phẩm có chữ "Mèo" trong Tên hoặc Loại.
           - Nếu khách hỏi "Thức ăn", ĐỪNG giới thiệu Bát ăn hay Dây dắt (trừ khi không còn gì khác).
           
        2. TRẢ LỜI:
           - Liệt kê 3 sản phẩm phù hợp nhất.
           - Báo giá và tình trạng kho.
           - Ngắn gọn, không dài dòng.
        """
        
        # Giảm max_retries xuống 1 để đỡ tốn thời gian nếu lỗi
        return self.llm_generate_with_retry(prompt, max_retries=2)

    # === Chat (có Bộ Lọc Cứng - Hard Filter) ===
    def chat(self, query, k=8):
        start = time.time()
        
        # 1. Tìm kiếm rộng (k=8) để lấy đủ thứ có thể liên quan
        relevant, scores = self.find_relevant_products(query, k)
        
        max_score = 0.0
        if len(scores) > 0:
            max_score = max(scores)

        # -------------------------------------------------------
        # BƯỚC 2: LOGIC LỌC CỨNG (QUAN TRỌNG NHẤT)
        # -------------------------------------------------------
        if not relevant.empty:
            query_lower = query.lower()
            target_category = None

            # Định nghĩa từ khóa để bắt dính nhu cầu
            # Key = Từ khách nói | Value = Tên Danh Mục trong DB (phải khớp chính xác chữ trong cột full_text "Loại: ...")
            keyword_rules = {
                "thức ăn": "Thức ăn",
                "đồ ăn": "Thức ăn",
                "hạt": "Thức ăn",
                "pate": "Thức ăn",
                "bánh thưởng": "Thức ăn",
                
                "đồ chơi": "Đồ chơi",
                "thú bông": "Đồ chơi",
                "bóng": "Đồ chơi",
                
                "phụ kiện": "Phụ kiện",
                "bát": "Phụ kiện",
                "dây dắt": "Phụ kiện",
                "vòng cổ": "Phụ kiện",
                "túi": "Phụ kiện",
                
                "vệ sinh": "Vệ sinh",
                "tắm": "Vệ sinh",
                "cát": "Vệ sinh"
            }

            # Kiểm tra xem khách có nhắc đến từ khóa nào không
            for kw, cat_name in keyword_rules.items():
                if kw in query_lower:
                    target_category = cat_name
                    break # Tìm thấy cái đầu tiên là chốt luôn (Ưu tiên)

            # Nếu xác định được danh mục, tiến hành LỌC
            if target_category:
                print(f"--> Phát hiện nhu cầu: {target_category}. Đang lọc dữ liệu...")
                
                # Lọc: Chỉ giữ lại dòng mà cột full_text có chứa "Loại: Thức ăn" (ví dụ)
                # Lưu ý: Cần đảm bảo trong full_text bạn đã map đúng tên danh mục "Thức ăn", "Phụ kiện"...
                filtered_relevant = relevant[relevant["full_text"].str.contains(f"Loại: {target_category}", case=False, na=False)]
                
                # Nếu lọc xong mà vẫn còn hàng -> Gán lại vào biến relevant
                if not filtered_relevant.empty:
                    relevant = filtered_relevant
                    print(f"--> Đã lọc còn {len(relevant)} sản phẩm đúng loại.")
                else:
                    print("--> Lọc xong không còn gì (có thể do tên danh mục không khớp), quay về dùng danh sách gốc.")
        # -------------------------------------------------------

        print(f"Max similarity (shop) = {max_score:.3f}")

        if relevant.empty or max_score < self.similarity_threshold:
            answer = "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn thử hỏi cụ thể hơn xem sao?"
            docs = []
        else:
            # Gọi hàm generate_answer (đã tối ưu cắt ngắn text ở bước trước)
            answer = self.generate_answer(query, relevant)
            
            docs = relevant[["name", "description", "price", "stock_quantity"]].replace({np.nan: None}).to_dict("records")

        return {
            "response": answer,
            "sources": docs,
            "processing_time": round(time.time() - start, 2),
            "max_similarity": float(max_score)
        }
        
    # === Real-time watcher ===
    def reload_index(self):
        """Hàm này được gọi khi có thay đổi trong DB"""
        print("Phát hiện thay đổi MongoDB! Đang build lại index...")
        if self.load_data():
            self.build_index()
            self.save_cache()
            print("Index shop đã được cập nhật.")
        
    def start_change_stream_watcher(self):
        print("Theo dõi thay đổi MongoDB (auto reload)...")
        # === SỬA LỖI "is not None" ===
        if self.db_collection is None:
             print("Không thể theo dõi, chưa kết nối MongoDB.")
             return

        try:
            # Kiểm tra xem Change Streams có được hỗ trợ không
            self.db_client.admin.command('hello')
            print("Change Streams được hỗ trợ.")
        except Exception as e:
            print(f"Change Streams không được hỗ trợ (chỉ có trên cluster M0+): {e}. Tắt auto-reload.")
            return

        def watch_changes():
            try:
                with self.db_collection.watch(full_document='updateLookup') as stream:
                    for change in stream:
                        print(f"MongoDB change detected: {change['operationType']}")
                        # Đơn giản là build lại mọi thứ khi có thay đổi
                        if change['operationType'] in ['insert', 'update', 'replace', 'delete']:
                            self.reload_index()
            except Exception as e:
                print(f"Lỗi Change Stream watcher: {e}")

        # Chạy watcher trong một thread riêng
        watcher_thread = Thread(target=watch_changes, daemon=True)
        watcher_thread.start()
        print("Watcher thread started (Change Stream supported).")