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
    def find_relevant_products(self, query, k=3):
        query_emb = self.get_embedding(query)
        if query_emb is None:
            return pd.DataFrame(), []

        q_vec = np.array([query_emb], dtype="float32")
        faiss.normalize_L2(q_vec)
        D, I = self.index.search(q_vec, k)
        return self.df.iloc[I[0]], D[0]

    # === Generation ===
    def generate_answer(self, query, relevant_data, animal_type=None):
        context = "\n".join(relevant_data["answers"].tolist())
        
        # --- LOGIC FILTER ĐỘNG VẬT ---
        animal_instruction = ""
        if animal_type:
            animal_instruction = f"""
            🚨 YÊU CẦU VỀ ĐỘNG VẬT:
            - Khách hỏi về: {animal_type.upper()}.
            - CHỈ trả lời thông tin liên quan đến {animal_type}.
            """
        
        prompt = f"""
        Bạn là trợ lý AI chuyên về Thú Cưng (TinyPaws).
        
        Nhiệm vụ: Trả lời câu hỏi dựa trên thông tin tham khảo.
        
        QUY TẮC AN TOÀN (QUAN TRỌNG):
        1. KIỂM TRA ĐỐI TƯỢNG: 
           - Nếu câu hỏi dùng chủ ngữ là con người (ví dụ: "tôi bị...", "chân tôi", "con tôi", "người yêu"...), hãy TỪ CHỐI TRẢ LỜI NGAY.
           - Chỉ nói ngắn gọn: "TinyPaws chỉ chuyên tư vấn sức khỏe cho chó mèo thôi ạ, sen đi khám bác sĩ người nha! 🐾".
           - TUYỆT ĐỐI KHÔNG đưa ra lời khuyên y tế cho người (kể cả khi bạn biết).
           
        2. CHỈ TRẢ LỜI KHI: Câu hỏi liên quan đến chó, mèo, thú cưng.
        
        {animal_instruction}
        
        Thông tin tham khảo (Dành cho thú cưng):
        {context}

        Câu hỏi: {query}
        """
        return self.llm_generate_with_retry(prompt)

    # === Chat (Đã sửa để nhận diện Chào hỏi xã giao) ===
    def chat(self, query, history=None, k=8):
        start = time.time()
        query_lower = query.lower()
        import re

        # --- 1. BỘ LỌC Ý ĐỊNH GẶP NHÂN VIÊN ---
        support_keywords = [
            "gặp nhân viên", "nói chuyện với người", "chat với admin", "tư vấn trực tiếp",
            "gặp tư vấn viên", "gặp người thật", "khiếu nại", "đơn hàng", "bom hàng",
            "hoàn tiền", "đổi trả", "ship lâu", "chưa nhận được", "giao sai", "giao chưa",
            "nhân viên hỗ trợ", "liên hệ shop", "alo shop", "chủ shop"
        ]
        
        for kw in support_keywords:
            if kw in query_lower:
                return {
                    "response": "Bạn vui lòng nhấn nút **'Liên hệ nhân viên hỗ trợ'** bên dưới để gặp nhân viên hỗ trợ nhé!",
                    "sources": [],
                    "fallback": True,
                    "processing_time": 0,
                    "max_similarity": 1.0
                }

        # --- 2. XỬ LÝ CÂU HỎI THÔNG TIN CHUNG (GIỜ, ĐỊA CHỈ) ---
        general_info = {
            "giờ": "TinyPaws mở cửa từ 9:00 sáng đến 9:00 tối tất cả các ngày trong tuần ạ!",
            "mở cửa": "TinyPaws mở cửa từ 9:00 sáng đến 9:00 tối tất cả các ngày trong tuần ạ!",
            "địa chỉ": "TinyPaws có địa chỉ tại: Lạc Long Quân, Điện Dương, Điện Bàn, Quảng Nam nha!",
            "ở đâu": "TinyPaws có địa chỉ tại: Lạc Long Quân, Điện Dương, Điện Bàn, Quảng Nam nha!",
            "sđt": "Hotline: 0765234567. Zalo: 0765234567",
            "điện thoại": "Hotline: 0765234567. Zalo: 0765234567"
        }
        
        for key, answer in general_info.items():
            if key in query_lower:
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

        # --- 4. TÌM KIẾM VÀ LỌC SẢN PHẨM (RAG) ---
        relevant, scores = self.find_relevant_products(context_query, k)
        max_score = float(max(scores)) if len(scores) else 0.0
        
        GREETING_KEYWORDS = ["hi", "hello", "chào", "alo", "ơi", "bot", "shop", "ad", "admin", "hỗ trợ"]
        is_greeting = any(kw in query_lower for kw in GREETING_KEYWORDS)

        if not relevant.empty:
            # A. BỘ LỌC DANH MỤC CỨNG (Hard Category Filter)
            # Fix lỗi hỏi Đồ chơi ra Bánh thưởng
            category_rules = {
                "đồ chơi": ["Đồ chơi", "Phụ kiện", "Dụng cụ"],
                "nhà cây": ["Đồ chơi", "Phụ kiện", "Chuồng"],
                "cat tree": ["Đồ chơi", "Phụ kiện", "Chuồng"],
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
                # Hàm kiểm tra xem sản phẩm có thuộc danh mục cho phép không
                def check_category_match(row):
                    full_txt = str(row.get('full_text', '')).lower()
                    cat_col = str(row.get('category', '')).lower()
                    # Kiểm tra trong cột Category hoặc trong Full Text có chứa từ khóa loại
                    return any(t.lower() in cat_col or f"loại: {t.lower()}" in full_txt for t in detected_categories)

                filtered_relevant = relevant[relevant.apply(check_category_match, axis=1)]
                
                # Chỉ áp dụng lọc nếu lọc xong vẫn còn sản phẩm (tránh lọc nhầm hết sạch)
                # Hoặc nếu ý định quá rõ ràng (như "thuốc") mà shop không có thì chấp nhận rỗng
                if not filtered_relevant.empty or "thuốc" in query_lower or "trị ve" in query_lower:
                    relevant = filtered_relevant
                    if relevant.empty:
                         print(f"Đã lọc theo danh mục {detected_categories} nhưng không có SP nào.")

        if not relevant.empty:
            # B. BỘ LỌC THƯƠNG HIỆU - XÓA ĐI
            # (Chỉ giữ lại logic lọc danh mục nếu cần)
            pass

        # --- 5. KIỂM TRA KẾT QUẢ ---
        if relevant.empty or max_score < self.similarity_threshold:
            is_greeting = any(kw in query_lower for kw in ["hi", "hello", "chào", "bạn ơi"])
            if is_greeting:
                greeting_prompt = f"""
                Người dùng: "{query}"
                Bạn là trợ lý TinyPaws. Hãy chào thân thiện, ngắn gọn.
                """
                return { "response": self.llm_generate_with_retry(greeting_prompt), "sources": [], "fallback": False, "processing_time": 0, "max_similarity": 0 }

            return {
                "response": "Dạ em tìm trong kho thì chưa thấy thông tin phù hợp ạ.\nBạn có muốn **chat trực tiếp với nhân viên** để được tư vấn kỹ hơn không?",
                "sources": [],
                "fallback": True,
                "processing_time": round(time.time() - start, 2),
                "max_similarity": max_score
            }

        # --- 6. TẠO CÂU TRẢ LỜI ---
        answer = self.generate_answer(query, relevant, animal_type)
        
        return {
            "response": answer,
            "sources": [],  # ⭐ Để rỗng vì PetRAG không trả về sản phẩm
            "fallback": False,
            "processing_time": round(time.time() - start, 2),
            "max_similarity": max_score
        }