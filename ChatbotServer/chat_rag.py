# -*- coding: utf-8 -*-
import os
import time
import faiss
import numpy as np
import pandas as pd
import google.generativeai as genai
import unicodedata

# === SỬA LỖI ĐƯỜNG DẪN ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "faiss_index.bin")
DATA_PATH = os.path.join(BASE_DIR, "qa_cache.parquet")
# ========================

# 🔥 EXPORT để main.py import được
__all__ = ['PetChatRAG', 'INDEX_PATH', 'DATA_PATH']

class PetChatRAG:
    def __init__(self, api_key, data_file):
        self.api_key = api_key
        self.data_file = data_file
        self.embedding_model_name = "models/text-embedding-004"
        self.df = None
        self.index = None
        self.llm_model = None
        self.embedding_dimension = None
        self.similarity_threshold = 0.35  # Giảm từ 0.55 xuống 0.35

        genai.configure(api_key=self.api_key)
        self.llm_model = genai.GenerativeModel("models/gemini-2.0-flash")

    # === Load data ===
    def load_data(self):
        try:
            self.df = pd.read_excel(self.data_file)
            
            # 🔥 THÊM: Test với 100 câu đầu tiên (xóa sau khi test xong)
            # self.df = self.df.head(100)  # Uncomment dòng này để test nhanh
            
            print(f"✅ Data loaded from {self.data_file} ({len(self.df)} records)")

            # 🔥 FIX: Không normalize tiếng Việt (gây mất dấu)
            self.df["question"] = self.df["question"].astype(str).str.lower()
            self.df["answers"] = self.df["answers"].astype(str)
            
            # Debug: In ra 3 câu đầu
            print("\n📋 Sample data:")
            for idx in range(min(3, len(self.df))):
                print(f"  Q{idx+1}: {self.df.iloc[idx]['question'][:60]}...")
                print(f"  A{idx+1}: {self.df.iloc[idx]['answers'][:60]}...")

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

    # === Retrieval (FIX: Thêm Keyword Matching) ===
    def find_relevant_products(self, query, k=3):
        query_emb = self.get_embedding(query)
        vector_results = pd.DataFrame()
        
        if query_emb is not None and self.index is not None:
            q_vec = np.array([query_emb], dtype="float32")
            faiss.normalize_L2(q_vec)
            D, I = self.index.search(q_vec, k)
            vector_results = self.df.iloc[I[0]].copy()
            vector_results["score"] = D[0]
        
        # 🔥 THÊM: Keyword Matching để tìm chính xác hơn
        query_lower = query.lower()
        important_keywords = [
            "rụng lông", "rụng", "chăm sóc", "dinh dưỡng", "vaccine", "tắm", 
            "chó con", "mèo con", "kitten", "puppy", "con",
            "triệt sản", "bầu", "sỏi thận", "tiết niệu", "ve rận", "bọ chét"
        ]
        
        keyword_results = pd.DataFrame()
        matched_indices = set()
        
        for kw in important_keywords:
            if kw in query_lower:
                matches = self.df[
                    self.df["question"].str.contains(kw, case=False, na=False, regex=False) |
                    self.df["answers"].str.contains(kw, case=False, na=False, regex=False)
                ]
                if not matches.empty:
                    matched_indices.update(matches.index.tolist())
                    print(f"🔍 Keyword '{kw}': Tìm thấy {len(matches)} câu hỏi")
        
        if matched_indices:
            keyword_results = self.df.loc[list(matched_indices)].copy()
            keyword_results["score"] = 0.85
            print(f"✅ Tổng {len(keyword_results)} kết quả từ keyword matching")
        
        # Gộp kết quả
        if not keyword_results.empty and not vector_results.empty:
            final_results = pd.concat([keyword_results, vector_results])
        elif not keyword_results.empty:
            final_results = keyword_results
        elif not vector_results.empty:
            final_results = vector_results
        else:
            return pd.DataFrame(), []
        
        final_results = final_results.drop_duplicates(subset=["question"])
        final_results = final_results.nlargest(k, "score")
        
        return final_results, final_results["score"].tolist()

    # === Generation ===
    def generate_answer(self, query, relevant_data, animal_type=None):
        # Lấy tối đa 5 câu để context không quá dài
        context_items = []
        for idx, row in relevant_data.head(5).iterrows():
            context_items.append(f"- Câu hỏi: {row['question']}\n  Trả lời: {row['answers']}")
        
        context = "\n\n".join(context_items)
        
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

    # === Chat (FIX: Thêm fallback thông minh) ===
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

        # --- 4. TÌM KIẾM ---
        relevant, scores = self.find_relevant_products(context_query, k)
        max_score = float(max(scores)) if len(scores) else 0.0
        
        print(f"🔎 Tìm được {len(relevant)} kết quả | Score cao nhất: {max_score:.2f}")

        # --- 5. KIỂM TRA KẾT QUẢ (FIX: Thêm fallback thông minh) ---
        if relevant.empty or max_score < self.similarity_threshold:
            # 🔥 FALLBACK THÔNG MINH
            fallback_topics = {
                "rụng lông": "Chó rụng lông có thể do thiếu dinh dưỡng, ký sinh trùng hoặc stress. Bạn nên:\n- Bổ sung Omega-3/6 (dầu cá)\n- Tắm đúng cách 2-4 tuần/lần\n- Đưa bé đi khám bác sĩ nếu rụng nhiều bất thường",
                
                "chăm sóc chó con": "Chăm sóc chó con cần:\n- Thức ăn chuyên dụng cho Puppy\n- Tiêm phòng đầy đủ (6-8 tuần tuổi)\n- Tắm sau khi tiêm vaccine 1 tuần\n- Huấn luyện từ nhỏ",
                
                "chăm sóc mèo con": "Chăm sóc mèo con cần:\n- Thức ăn cho Kitten (protein cao)\n- Tiêm phòng 3 mũi (8-16 tuần)\n- Vệ sinh khay cát hàng ngày\n- Chơi đùa để phát triển",
            }
            
            for topic, answer in fallback_topics.items():
                if topic in query_lower:
                    return {
                        "response": f"{answer}\n\n💡 Bạn có thể hỏi thêm hoặc **chat với nhân viên** để được tư vấn chi tiết hơn nhé!",
                        "sources": [],
                        "fallback": True,
                        "processing_time": round(time.time() - start, 2),
                        "max_similarity": max_score
                    }
            
            # Fallback chung
            is_greeting = any(kw in query_lower for kw in ["hi", "hello", "chào", "alo"])
            if is_greeting:
                greeting_prompt = f"""
                Người dùng: "{query}"
                Bạn là trợ lý TinyPaws. Hãy chào thân thiện, ngắn gọn.
                """
                return { "response": self.llm_generate_with_retry(greeting_prompt), "sources": [], "fallback": False, "processing_time": 0, "max_similarity": 0 }

            return {
                "response": "Dạ em chưa có thông tin chi tiết về vấn đề này trong cơ sở dữ liệu.\n\n💡 Bạn có thể:\n- Thử hỏi cách khác (ví dụ: 'chó rụng lông nhiều' thay vì 'chó bị rụng lông')\n- **Chat trực tiếp với nhân viên** để được tư vấn kỹ hơn",
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

    def generate_answer(self, query, relevant_data, animal_type=None):
        # Lấy tối đa 5 câu để context không quá dài
        context_items = []
        for idx, row in relevant_data.head(5).iterrows():
            context_items.append(f"- Câu hỏi: {row['question']}\n  Trả lời: {row['answers']}")
        
        context = "\n\n".join(context_items)
        
        animal_instruction = ""
        if animal_type == "Mèo":
            animal_instruction = "Bạn đang tư vấn cho một khách hàng có mèo. Hãy đưa ra lời khuyên chăm sóc mèo."
        elif animal_type == "Chó":
            animal_instruction = "Bạn đang tư vấn cho một khách hàng có chó. Hãy đưa ra lời khuyên chăm sóc chó."
        
        prompt = f"""
        Bạn là trợ lý chuyên gia chăm sóc thú cưng của TinyPaws.
        
        {animal_instruction}
        
        THÔNG TIN THAM KHẢO (Từ cơ sở kiến thức):
        {context}

        CÂU HỎI: "{query}"
        
        QUY TẮC TRẢ LỜI:
        1. Dựa vào thông tin tham khảo trên để trả lời.
        2. Nếu thông tin không đủ chi tiết, hãy đưa ra lời khuyên chung và gợi ý: "Bạn nên đưa bé đến bác sĩ thú y để được khám kỹ hơn."
        3. Trả lời ngắn gọn, dễ hiểu, thân thiện.
        4. KHÔNG dùng icon 🐾 trong câu trả lời.
        5. Nếu câu hỏi về bệnh nghiêm trọng (sỏi thận, tiết niệu, ung thư...), LUÔN khuyên đi bác sĩ.
        """
        return self.llm_generate_with_retry(prompt)