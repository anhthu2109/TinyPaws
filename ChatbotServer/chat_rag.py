# -*- coding: utf-8 -*-
import os
import time
import faiss
import numpy as np
import pandas as pd
import google.generativeai as genai
import unicodedata

# === SỬA LỖI ĐƯỜNG DẪN ===
# Lấy đường dẫn tuyệt đối của thư mục chứa file chat_rag.py này
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Định nghĩa đường dẫn cache dựa trên BASE_DIR
INDEX_PATH = os.path.join(BASE_DIR, "faiss_index.bin")
DATA_PATH = os.path.join(BASE_DIR, "qa_cache.parquet")
# ========================

class PetChatRAG:
    def __init__(self, api_key, data_file):
        self.api_key = api_key
        self.data_file = data_file
        self.embedding_model_name = "models/text-embedding-004"
        self.df = None
        self.index = None
        self.llm_model = None
        self.embedding_dimension = None
        self.similarity_threshold = 0.55

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")

    # === Load data ===
    def load_data(self):
        try:
            self.df = pd.read_excel(self.data_file)
            print(f"Data loaded from {self.data_file} ({len(self.df)} records)")

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
            print(f"Error loading data: {e}")
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
        print("Building embeddings...")
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
        print(f"FAISS index built successfully ({len(embeddings)} vectors).")


    # === Cache ===
    def save_cache(self, index_path="faiss_index.bin", data_path="qa_cache.parquet"):
        try:
            faiss.write_index(self.index, index_path)
            self.df.to_parquet(data_path, index=False)
            print(f"Cache saved: {index_path}, {data_path}")
        except Exception as e:
            print(f"Error saving cache: {e}")

    def load_cache(self, index_path="faiss_index.bin", data_path="qa_cache.parquet"):
        try:
            if os.path.exists(index_path) and os.path.exists(data_path):
                self.index = faiss.read_index(index_path)
                self.df = pd.read_parquet(data_path)
                print(f"Cache loaded ({len(self.df)} records).")
                return True
            return False
        except Exception as e:
            print(f"Error loading cache: {e}")
            return False

    # === Setup ===
    def setup_with_cache(self):
        print("Initializing chatbot...")
        if self.load_cache():
            print("Loaded from cache!")
            return
        if not self.load_data():
            raise Exception("Failed to load data file.")
        self.build_index()
        self.save_cache()
        print("Chatbot ready with new embeddings!")

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
        Bạn là trợ lý AI chuyên về Thú Cưng (TinyPaws).
        
        Nhiệm vụ: Trả lời câu hỏi dựa trên thông tin tham khảo.
        
        QUY TẮC AN TOÀN (QUAN TRỌNG):
        1. KIỂM TRA ĐỐI TƯỢNG: 
           - Nếu câu hỏi dùng chủ ngữ là con người (ví dụ: "tôi bị...", "chân tôi", "con tôi", "người yêu"...), hãy TỪ CHỐI TRẢ LỜI NGAY.
           - Chỉ nói ngắn gọn: "TinyPaws chỉ chuyên tư vấn sức khỏe cho chó mèo thôi ạ, sen đi khám bác sĩ người nha! 🐾".
           - TUYỆT ĐỐI KHÔNG đưa ra lời khuyên y tế cho người (kể cả khi bạn biết).
           
        2. CHỈ TRẢ LỜI KHI: Câu hỏi liên quan đến chó, mèo, thú cưng.
        
        Thông tin tham khảo (Dành cho thú cưng):
        {context}

        Câu hỏi: {query}
        """
        return self.llm_generate_with_retry(prompt)

    # === Chat (Đã sửa để nhận diện Chào hỏi xã giao) ===
    def chat(self, query, k=3):
        start = time.time()
        
        # Tìm kiếm dữ liệu liên quan
        relevant, scores = self.find_relevant_answers(query, k)

        max_sim = max(scores) if len(scores) else 0.0
        print(f"Max similarity = {max_sim:.3f} (threshold = {self.similarity_threshold})")

        query_lower = query.lower()

        # 1. Từ khóa chuyên môn (Giữ nguyên)
        PET_KEYWORDS = ["chó", "cho", "cún", "mèo", "meo", "pet", "thú cưng",
                        "rối loạn", "bệnh", "chăm sóc", "ăn", "thức ăn", "khẩu phần",
                        "tắm", "spa", "sức khỏe", "huấn luyện", "khám", "chó con"]
        is_pet_query = any(kw in query_lower for kw in PET_KEYWORDS)

        # 2. THÊM MỚI: Từ khóa chào hỏi / Xã giao
        GREETING_KEYWORDS = ["hi", "hello", "chào", "alo", "ơi", "shop", "ad", "admin", "bot", "giúp", "hú", "bạn ơi"]
        is_greeting = any(kw in query_lower for kw in GREETING_KEYWORDS)

        # 3. LOGIC CHẶN (Sửa lại điều kiện lọc)
        # Chặn nếu: (Không phải từ khóa Pet VÀ Không phải chào hỏi)
        # HOẶC: (Điểm similarity thấp VÀ Không phải chào hỏi)
        if (not is_pet_query and not is_greeting) or (max_sim < self.similarity_threshold and not is_greeting):
            return {
                "response": "TinyPaws chỉ hỗ trợ các vấn đề về thú cưng. "
                            "Bạn có thể hỏi về chăm sóc chó mèo nhé!",
                "similar_documents": [],
                "processing_time": round(time.time() - start, 2),
                "max_similarity": round(max_sim, 3)
            }

        # 4. XỬ LÝ TRẢ LỜI
        # Trường hợp A: Chỉ là câu chào hỏi xã giao (Điểm thấp, không tìm thấy dữ liệu y tế)
        if is_greeting and max_sim < self.similarity_threshold:
            prompt = f"""
            Người dùng nói: "{query}"
            Bạn là chuyên gia chăm sóc thú cưng (AI) của TinyPaws.
            Hãy chào lại người dùng một cách thân thiện, ngắn gọn, dùng emoji 🐾.
            Gợi ý họ có thể hỏi về: sức khỏe, dinh dưỡng, hoặc cách huấn luyện chó mèo.
            """
            answer = self.llm_generate_with_retry(prompt)
            docs = []

        # Trường hợp B: Có nội dung chuyên môn (Điểm cao hoặc có từ khóa Pet)
        else:
            # Dùng hàm generate_answer có sẵn để trả lời dựa trên Knowledge Base
            answer = self.generate_answer(query, relevant)
            docs = relevant[["question", "answers"]].replace({np.nan: None}).to_dict("records")

        return {
            "response": answer,
            "similar_documents": docs,
            "processing_time": round(time.time() - start, 2),
            "max_similarity": round(max_sim, 3)
        }