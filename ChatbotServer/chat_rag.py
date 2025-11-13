%%writefile chat_rag.py
# -*- coding: utf-8 -*-
import os
import time
import faiss
import numpy as np
import pandas as pd
import google.generativeai as genai
import unicodedata

class PetChatRAG:
    def __init__(self, api_key, data_file):
        self.api_key = api_key
        self.data_file = data_file
        self.embedding_model_name = "models/text-embedding-004"
        self.df = None
        self.index = None
        self.llm_model = None
        self.embedding_dimension = None
        self.similarity_threshold = 0.55  # Increased for better precision

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")

    # === Load data ===
    def load_data(self):
        try:
            self.df = pd.read_excel(self.data_file)
            print(f"✅ Data loaded from {self.data_file} ({len(self.df)} records)")

            # ✅ Chuẩn hóa văn bản cho cột question
            self.df["question"] = (
                self.df["question"]
                .astype(str)
                .str.lower()
                .apply(lambda x: unicodedata.normalize("NFKD", x))
                .str.encode("ascii", errors="ignore")
                .str.decode("utf-8")
            )

            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False


    # === Embedding ===
    def get_embedding(self, text):
        try:
            result = genai.embed_content(model=self.embedding_model_name, content=text)
            return result["embedding"]
        except Exception as e:
            print(f"❌ Error getting embedding: {e}")
            return None

    # === Retry wrapper for LLM ===
    def llm_generate_with_retry(self, prompt, max_retries=3, backoff=2.0):
        for attempt in range(max_retries):
            try:
                response = self.llm_model.generate_content(prompt)
                return response.text
            except Exception as e:
                print(f"⚠️ Lỗi LLM (lần {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(backoff * (attempt + 1))
        return "Xin lỗi, tôi tạm thời không thể trả lời lúc này."

    # === Build FAISS index (Cosine) ===
    def build_index(self):
        print("🔄 Building embeddings...")
        self.df["embedding"] = (
            self.df.apply(
                lambda x: self.get_embedding(f"{x['question']} {x['answers']}"),
                axis=1
            )
        )
        self.df.dropna(subset=["embedding"], inplace=True)

        embeddings = np.array(self.df["embedding"].tolist()).astype("float32")
        faiss.normalize_L2(embeddings)
        self.embedding_dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(self.embedding_dimension)
        self.index.add(embeddings)
        print(f"✅ FAISS index built successfully ({len(embeddings)} vectors).")

    # === Cache ===
    def save_cache(self, index_path="faiss_index.bin", data_path="qa_cache.parquet"):
        try:
            faiss.write_index(self.index, index_path)
            self.df.to_parquet(data_path, index=False)
            print(f"💾 Cache saved: {index_path}, {data_path}")
        except Exception as e:
            print(f"❌ Error saving cache: {e}")

    def load_cache(self, index_path="faiss_index.bin", data_path="qa_cache.parquet"):
        try:
            if os.path.exists(index_path) and os.path.exists(data_path):
                self.index = faiss.read_index(index_path)
                self.df = pd.read_parquet(data_path)
                print(f"✅ Cache loaded ({len(self.df)} records).")
                return True
            return False
        except Exception as e:
            print(f"❌ Error loading cache: {e}")
            return False

    # === Setup ===
    def setup_with_cache(self):
        print("🚀 Initializing chatbot...")
        if self.load_cache():
            print("✅ Loaded from cache!")
            return
        if not self.load_data():
            raise Exception("❌ Failed to load data file.")
        self.build_index()
        self.save_cache()
        print("✨ Chatbot ready with new embeddings!")

    # === Retrieval ===
    def find_relevant_answers(self, query, k=3):
        query_emb = self.get_embedding(query)
        if query_emb is None:
            return pd.DataFrame(), []

        q_vec = np.array([query_emb], dtype="float32")
        faiss.normalize_L2(q_vec)
        D, I = self.index.search(q_vec, k)
        return self.df.iloc[I[0]], D[0]

    # === Generation ===
    def generate_answer(self, query, relevant_data):
        context = "\n".join(relevant_data["answers"].tolist())
        prompt = f"""
        Bạn là chuyên gia chăm sóc thú cưng TinyPaws.
        Hãy trả lời câu hỏi dưới đây chỉ dựa vào thông tin tham khảo.

        Câu hỏi: {query}
        Thông tin tham khảo:
        {context}

        Hãy trả lời ngắn gọn, rõ ràng, đúng dữ kiện và thân thiện.
        """
        return self.llm_generate_with_retry(prompt)

    # === Chat ===
    def chat(self, query, k=3):
        start = time.time()
        relevant, scores = self.find_relevant_answers(query, k)

        print(f"🔍 Max similarity = {max(scores):.3f} (threshold = {self.similarity_threshold})")
        if len(scores) == 0 or max(scores) < self.similarity_threshold:
            answer = "Xin lỗi, tôi không tìm thấy thông tin đáng tin cậy để trả lời câu hỏi này."
            docs = []
        else:
            answer = self.generate_answer(query, relevant)
            docs = relevant[["question", "answers"]].replace({np.nan: None}).to_dict("records")

        return {
            "response": answer,
            "similar_documents": docs,
            "processing_time": round(time.time() - start, 2),
            "max_similarity": float(max(scores)) if len(scores) else 0.0
        }