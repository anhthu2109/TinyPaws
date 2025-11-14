from fastapi import FastAPI 
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware 
from chat_rag import PetChatRAG
from chat_rag_shop_mongo import ShopRAGMongo
import os
import time
from dotenv import load_dotenv

# load env
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

if not GOOGLE_API_KEY:
    raise ValueError("Thiếu GOOGLE_API_KEY trong .env")
if not MONGO_URI:
    raise ValueError("Thiếu MONGO_URI trong .env")

# Prefer augmented v2 if exists
PET_DATA_FILE = "pet_data.xlsx"

app = FastAPI(title="TinyPaws Chatbot API")

# --- ĐÂY LÀ ĐOẠN SỬA QUAN TRỌNG ---
# Cho phép tất cả các nguồn (origins) gọi vào API này
# Rất quan trọng để Vercel (Frontend) có thể gọi được
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả (an toàn cho đồ án)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- HẾT ĐOẠN SỬA ---

print("Đang khởi tạo mô hình chatbot...")

pet_rag = PetChatRAG(GOOGLE_API_KEY, PET_DATA_FILE)
shop_rag = ShopRAGMongo(GOOGLE_API_KEY, MONGO_URI, db_name="TINYPAWS", collection="products")

start_time = time.time()

# Setup with caches / build index if needed
pet_rag.setup_with_cache()
shop_rag.setup(start_watcher=True)

print(f"Tất cả chatbot đã sẵn sàng! ({round(time.time() - start_time, 2)}s)")

class ChatRequest(BaseModel):
    message: str

# SHOP_KEYWORDS: **không** bao gồm 'tắm' hoặc các từ chăm sóc
SHOP_KEYWORDS = [
    "shop", "cửa hàng", "địa chỉ", "vận chuyển", "ship", "giao hàng",
    "giá", "bán", "sản phẩm", "mua", "thanh toán", "khuyến mãi", "sale",
    "đổi trả", "hóa đơn", "tồn kho", "inventory", "order", "pay", "paypal"
]

def detect_query_type(message: str):
    msg = (message or "").lower()
    # Nếu client explicitly mentions product id or "product", or our keywords -> treat as shop
    if any(kw in msg for kw in SHOP_KEYWORDS):
        return "shop"
    return "pet"

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    query = req.message.strip()
    query_type = detect_query_type(query)

    print(f"Loại câu hỏi: {query_type.upper()} | Câu: {query}")

    if query_type == "shop":
        result = shop_rag.chat(query)
    else:
        result = pet_rag.chat(query)

    return {
        "response": result["response"],
        "sources": result.get("similar_documents") or result.get("sources"),
        "type": query_type,
        "time": result.get("processing_time", result.get("time", 0))
    }

@app.post("/admin/reindex/shop")
def reindex_shop():
    try:
        shop_rag.reload_index()
        return {"success": True, "message": "Shop index reloaded"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/chat/pet")
def chat_pet(req: ChatRequest):
    return pet_rag.chat(req.message)

@app.post("/chat/shop")
def chat_shop(req: ChatRequest):
    return shop_rag.chat(req.message)

@app.get("/")
def root():
    return {"message": "TinyPaws Chatbot API đang hoạt động"}