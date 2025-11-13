# -*- coding: utf-8 -*-
"""
Tự động mở rộng bộ dữ liệu chatbot thú cưng
Sinh thêm câu hỏi tương tự từ dữ liệu gốc bằng Gemini
"""

import pandas as pd
import google.generativeai as genai
import os
import time
import random

# === CẤU HÌNH ===
GOOGLE_API_KEY = "AIzaSyDhjWFA_r-beuXx4V_k77MbMXjFOu6iz08"
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)

INPUT_FILE = "pet_data.xlsx"
OUTPUT_FILE = "pet_data_augmented.xlsx"
NUM_VARIANTS_PER_QUESTION = 2   # mỗi câu gốc sinh thêm 3 câu tương tự

# === HÀM SINH CÂU HỎI TƯƠNG TỰ ===
def generate_similar_questions(question):
    prompt = f"""
    Bạn là trợ lý AI chuyên mở rộng dữ liệu huấn luyện chatbot.
    Hãy viết {NUM_VARIANTS_PER_QUESTION} câu hỏi khác nhau nhưng cùng ý nghĩa với câu sau,
    dùng ngôn ngữ tự nhiên, đa dạng cách diễn đạt, ngắn gọn và thân thiện.

    Câu gốc: "{question}"

    Trả về dạng danh sách, mỗi dòng 1 câu hỏi.
    """

    try:
        response = genai.GenerativeModel("gemini-2.0-flash").generate_content(prompt)
        text = response.text.strip()
        variants = [line.strip("-• \n") for line in text.split("\n") if line.strip()]
        return variants[:NUM_VARIANTS_PER_QUESTION]
    except Exception as e:
        print(f"❌ Lỗi khi sinh câu hỏi cho '{question}': {e}")
        return []

# === MAIN ===
def augment_dataset():
    df = pd.read_excel(INPUT_FILE)
    print(f"📘 Loaded {len(df)} original Q&A entries")

    new_rows = []

    for i, row in df.iterrows():
        q, a = row["question"], row["answers"]
        print(f"\n🔄 Đang mở rộng: {q}")
        variants = generate_similar_questions(q)

        for v in variants:
            new_rows.append({"question": v, "answers": a})

        # delay nhẹ để tránh giới hạn tốc độ API
        time.sleep(random.uniform(1.5, 3.0))

    # ghép dữ liệu cũ + mới
    df_new = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
    df_new.to_excel(OUTPUT_FILE, index=False)

    print(f"\n✅ Đã tạo file mở rộng: {OUTPUT_FILE}")
    print(f"📈 Tổng số câu hỏi: {len(df_new)}")

if __name__ == "__main__":
    augment_dataset()
