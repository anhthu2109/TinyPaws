# -*- coding: utf-8 -*-
import os
import time
import threading
import pandas as pd
import numpy as np
from pymongo import MongoClient
import faiss
import google.generativeai as genai


class ShopRAGMongo:
    def __init__(self, api_key, mongo_uri, db_name="TINYPAWS", collection="products"):
        self.api_key = api_key
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.collection_name = collection

        # Kết nối MongoDB
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection]

        # Cấu hình Gemini API
        genai.configure(api_key=self.api_key)
        self.embedding_model = "models/text-embedding-004"
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")

        # Biến lưu trữ dữ liệu
        self.data = None
        self.index = None
        self.watch_thread = None

    # === 1. LOAD DATA TỪ MONGODB ===
    def load_data(self):
        docs = list(self.collection.find(
            {}, {"name": 1, "description": 1, "price": 1, "stock_quantity": 1}
        ))

        if not docs:
            print("MongoDB chưa có sản phẩm nào.")
            self.data = pd.DataFrame()
            return

        df = pd.DataFrame(docs)
        df["_id"] = df["_id"].astype(str)
        df["combined"] = df.apply(
            lambda x: f"{x.get('name', '')}. {x.get('description', '')}. Giá: {x.get('price', '')}đ.",
            axis=1,
        )
        self.data = df
        print(f"Loaded {len(df)} sản phẩm từ MongoDB.")

    # === 2️. KIỂM TRA REPLICA SET/ATLAS CLUSTER ===
    def supports_change_streams(self):
        try:
            info = self.client.admin.command("hello")
            return bool(info.get("setName"))  # chỉ true nếu replica set / Atlas
        except Exception as e:
            print(f"Không thể kiểm tra Change Stream support: {e}")
            return False

    # === 3️. LẤY EMBEDDING TỪ GEMINI ===
    def get_embedding(self, text):
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=text
            )
            return result["embedding"]
        except Exception as e:
            print(f"Lỗi lấy embedding: {e}")
            return None

    # === 4️. TẠO EMBEDDING CHO TOÀN BỘ DATA (CÓ RATE LIMIT) ===
    def create_embeddings_for_data(self):
        if self.data is None or self.data.empty:
            return

        print("Đang tạo embeddings cho sản phẩm...")
        embeddings = []
        for text in self.data["combined"].tolist():
            emb = self.get_embedding(text)
            embeddings.append(emb)
            time.sleep(0.05)  # tránh rate limit Gemini
        self.data["embedding"] = embeddings
        self.data.dropna(subset=["embedding"], inplace=True)

    # === 5️. XÂY DỰNG FAISS INDEX ===
    def build_index(self):
        if self.data is None or self.data.empty:
            print("Không có dữ liệu để tạo index.")
            return

        if "embedding" not in self.data.columns or self.data["embedding"].isnull().any():
            self.create_embeddings_for_data()

        embeddings = np.array(self.data["embedding"].tolist(), dtype="float32")
        if embeddings.size == 0:
            print("Không có embedding hợp lệ.")
            return

        dim = embeddings.shape[1]
        faiss.normalize_L2(embeddings)
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)
        print(f"FAISS index được tạo với {len(self.data)} sản phẩm.")

    # === 6️. CACHE INDEX & DATA ===
    def save_cache(self, index_path="shop_faiss.bin", data_path="shop_cache.parquet"):
        try:
            if self.index is not None:
                faiss.write_index(self.index, index_path)
            if self.data is not None:
                self.data.to_parquet(data_path, index=False)
            print("Shop cache saved.")
        except Exception as e:
            print(f"Lỗi lưu cache: {e}")

    def load_cache(self, index_path="shop_faiss.bin", data_path="shop_cache.parquet"):
        try:
            if os.path.exists(index_path) and os.path.exists(data_path):
                self.index = faiss.read_index(index_path)
                self.data = pd.read_parquet(data_path)
                print("Shop cache loaded.")
                return True
            return False
        except Exception as e:
            print(f"Lỗi load cache: {e}")
            return False

    # === 7️. TÌM SẢN PHẨM LIÊN QUAN ===
    def search_products(self, query, k=3):
        if self.index is None:
            return pd.DataFrame()

        q_emb = self.get_embedding(query)
        if q_emb is None:
            return pd.DataFrame()

        q_vec = np.array([q_emb], dtype="float32")
        faiss.normalize_L2(q_vec)
        D, I = self.index.search(q_vec, k)
        return self.data.iloc[I[0]]

    # === 8️. CHATBOT TRẢ LỜI NGƯỜI DÙNG ===
    def chat(self, query):
        start_time = time.time()
        results = self.search_products(query)

        if results.empty:
            return {"response": "Xin lỗi, hiện tôi chưa có thông tin phù hợp.", "sources": []}

        # Tạo context mô tả sản phẩm
        context = "\n".join(
            [f"* {r['name']}: {r['description']} (Giá: {r['price']}đ)" for _, r in results.iterrows()]
        )

        # Prompt hướng dẫn Gemini
        prompt = f"""
        Bạn là trợ lý bán hàng TinyPaws. Dưới đây là thông tin các sản phẩm KHẢ DỤNG (dựa trên dữ liệu cửa hàng). 
        *Bạn chỉ được sử dụng chính xác thông tin dưới đây để trả lời. KHÔNG được thêm/bịa đặt thông tin về hàng tồn kho, mẫu, giá, hay dịch vụ nếu không có trong danh sách.* 

        Sản phẩm liên quan:
        {context}

        Câu hỏi: "{query}"

        Hãy trả lời ngắn gọn, nếu không có thông tin xác thực thì trả lời: 
        "Xin lỗi, hiện TinyPaws không có thông tin đó. Bạn có muốn mình kiểm tra hoặc giới thiệu sản phẩm tương tự không?"
        """

        # Sinh phản hồi từ LLM
        try:
            response = self.llm_model.generate_content(prompt)
            answer = response.text.strip()
        except Exception as e:
            answer = f"Xin lỗi, tôi không thể tạo câu trả lời lúc này. ({e})"

        # === Làm sạch dữ liệu JSON-safe ===
        results = results.copy()
        if "_id" in results.columns:
            results["_id"] = results["_id"].astype(str)
        if "embedding" in results.columns:
            results = results.drop(columns=["embedding"])

        safe_results = []
        for _, row in results.iterrows():
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, (np.generic, np.float32, np.int32, np.int64)):
                    clean_row[k] = v.item()
                elif isinstance(v, (list, np.ndarray)):
                    clean_row[k] = [float(x) for x in v]
                else:
                    clean_row[k] = v
            safe_results.append(clean_row)

        return {
            "response": answer,
            "sources": safe_results,
            "processing_time": round(float(time.time() - start_time), 2),
        }

    # === 9️.AUTO-WATCH MONGODB (Chỉ dùng nếu ReplicaSet/Atlas) ===
    def watch_for_changes(self):
        print("Theo dõi thay đổi MongoDB (auto reload)...")
        try:
            with self.collection.watch() as stream:
                for change in stream:
                    print(f"Phát hiện thay đổi: {change['operationType']}")
                    self.reload_index()
        except Exception as e:
            print(f"Lỗi trong watch_for_changes: {e}")

    def reload_index(self):
        print("Đang cập nhật dữ liệu và FAISS index...")
        self.load_data()
        self.build_index()
        print("Dữ liệu & index đã được cập nhật!")

    # === 10. KHỞI TẠO HỆ THỐNG ===
    def setup(self, start_watcher=True):
        if not self.load_cache():
            self.load_data()
            self.build_index()
            self.save_cache()

        if start_watcher and self.supports_change_streams():
            self.watch_thread = threading.Thread(target=self.watch_for_changes, daemon=True)
            self.watch_thread.start()
            print("Watcher thread started (Change Stream supported).")
        else:
            print("Change Stream not supported or watcher disabled.")
