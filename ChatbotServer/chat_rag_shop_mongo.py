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
# Lấy đường dẫn tuyệt đối của thư mục chứa file này
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Định nghĩa đường dẫn cache dựa trên BASE_DIR
SHOP_INDEX_PATH = os.path.join(BASE_DIR, "shop_faiss.bin")
SHOP_DATA_PATH = os.path.join(BASE_DIR, "shop_cache.parquet")
# ========================


class ShopRAGMongo:
    def __init__(self, api_key, mongo_uri, db_name="TINYPAWS", collection="products"):
        self.api_key = api_key
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.collection_name = collection
        self.embedding_model_name = "models/text-embedding-004"
        self.df = pd.DataFrame()
        self.index = None
        self.llm_model = None
        self.db_client = None
        self.db_collection = None
        self.embedding_dimension = 768 # Default
        self.similarity_threshold = 0.55

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")
        
        try:
            self.db_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            self.db_client.server_info() # Test connection
            self.db_collection = self.db_client[db_name][collection]
            print(f"Kết nối MongoDB thành công: {db_name}.{collection}")
        except errors.ServerSelectionTimeoutError as err:
            print(f"Lỗi kết nối MongoDB: {err}")
            self.db_client = None
            self.db_collection = None
        except Exception as e:
            print(f"Lỗi MongoDB không xác định: {e}")
            self.db_client = None
            self.db_collection = None

    # === Load data from MongoDB ===
    def load_data(self):
        if not self.db_collection:
            print("Bỏ qua load data, không có kết nối MongoDB.")
            return False
            
        try:
            cursor = self.db_collection.find({}, {"name": 1, "description": 1, "price": 1, "stock": 1, "category": 1})
            products = list(cursor)
            if not products:
                 print("Không tìm thấy sản phẩm nào trong MongoDB.")
                 self.df = pd.DataFrame(columns=["_id", "name", "description", "price", "stock", "category", "full_text"])
                 return True # Vẫn thành công nhưng là df rỗng

            self.df = pd.DataFrame(products)
            self.df["_id"] = self.df["_id"].astype(str)
            
            # (Giữ nguyên phần chuẩn hóa ...)
            self.df["full_text"] = self.df.apply(
                lambda row: f"Tên: {row['name']}. Mô tả: {row.get('description', '')}. Giá: {row.get('price', 0)} VND. Tồn kho: {row.get('stock', 0)}",
                axis=1
            )
            
            print(f"Loaded {len(self.df)} sản phẩm từ MongoDB.")
            return True
        except Exception as e:
            print(f"Lỗi load data từ MongoDB: {e}")
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
            self.index = faiss.IndexFlatIP(self.embedding_dimension) # Tạo index rỗng
            return

        self.df["embedding"] = (
            self.df["full_text"].astype(str).apply(self.get_embedding)
        )
        self.df.dropna(subset=["embedding"], inplace=True)

        if self.df.empty:
            print("Không có embedding nào được tạo, index sẽ rỗng.")
            self.index = faiss.IndexFlatIP(self.embedding_dimension) # Tạo index rỗng
            return

        embeddings = np.array(self.df["embedding"].tolist()).astype("float32")
        faiss.normalize_L2(embeddings)
        self.embedding_dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(self.embedding_dimension)
        self.index.add(embeddings)
        print(f"FAISS index được tạo với {len(self.df)} sản phẩm.")

    # === Cache ===
    def save_cache(self, index_path=SHOP_INDEX_PATH, data_path=SHOP_DATA_PATH): # Sử dụng đường dẫn mới
        try:
            if self.index:
                faiss.write_index(self.index, index_path)
            if not self.df.empty:
                self.df.to_parquet(data_path, index=False, engine='pyarrow')
            print(f"Cache shop đã lưu: {index_path}, {data_path}")
        except Exception as e:
            print(f"Lỗi lưu cache: {e}")

    def load_cache(self, index_path=SHOP_INDEX_PATH, data_path=SHOP_DATA_PATH): # Sử dụng đường dẫn mới
        try:
            if os.path.exists(index_path) and os.path.exists(data_path):
                self.index = faiss.read_index(index_path)
                self.df = pd.read_parquet(data_path, engine='pyarrow') # Thêm engine
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
                self.index = faiss.IndexFlatIP(self.embedding_dimension) # Khởi tạo index rỗng
            else:
                self.build_index()
                self.save_cache()
            
        print("ShopRAG sẵn sàng!")
        
        if start_watcher and self.db_collection:
            self.start_change_stream_watcher()
    
    # === Retrieval ===
    def find_relevant_products(self, query, k=3):
        query_emb = self.get_embedding(query)
        if query_emb is None:
            return pd.DataFrame(), []

        q_vec = np.array([query_emb], dtype="float32")
        faiss.normalize_L2(q_vec)

        if not self.index or self.index.ntotal == 0:
             print("Index (shop) rỗng, không thể tìm kiếm.")
             return pd.DataFrame(), []
             
        D, I = self.index.search(q_vec, k)
        return self.df.iloc[I[0]], D[0]

    # === Generation ===
    def generate_answer(self, query, relevant_data):
        if relevant_data.empty:
             return self.llm_generate_with_retry(f"Bạn là trợ lý mua sắm của TinyPaws. Hãy trả lời câu hỏi của khách: {query}. (Lưu ý: không tìm thấy sản phẩm liên quan, hãy trả lời chung về shop).")

        context = "\n".join(relevant_data["full_text"].tolist())
        prompt = f"""
        Bạn là trợ lý mua sắm của TinyPaws.
        Trả lời câu hỏi của khách hàng chỉ dựa vào thông tin sản phẩm tham khảo.

        Câu hỏi: {query}
        Thông tin sản phẩm:
        {context}

        Hãy trả lời thân thiện, tập trung vào sản phẩm, giá cả, và tồn kho.
        """
        return self.llm_generate_with_retry(prompt)

    # === Chat ===
    def chat(self, query, k=3):
        start = time.time()
        relevant, scores = self.find_relevant_products(query, k)

        max_score = 0.0
        if len(scores) > 0:
            max_score = max(scores)

        print(f"Max similarity (shop) = {max_score:.3f} (threshold = {self.similarity_threshold})")

        if relevant.empty or max_score < self.similarity_threshold:
            answer = "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với câu hỏi của bạn. Bạn có thể hỏi về chó, mèo, hoặc các sản phẩm khác không?"
            docs = []
        else:
            answer = self.generate_answer(query, relevant)
            docs = relevant[["name", "description", "price", "stock"]].replace({np.nan: None}).to_dict("records")

        return {
            "response": answer,
            "sources": docs,
            "processing_time": round(time.time() - start, 2),
            "max_similarity": float(max_score)
        }
        
    # === Real-time watcher ===
    def reload_index(self):
        """Hàm này được gọi khi có thay đổi trong DB"""
        print(" Phát hiện thay đổi MongoDB! Đang build lại index...")
        if self.load_data():
            self.build_index()
            self.save_cache()
            print("Index shop đã được cập nhật.")
        
    def start_change_stream_watcher(self):
        print(" Theo dõi thay đổi MongoDB (auto reload)...")
        if not self.db_collection:
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