from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from chat_rag import PetChatRAG
from chat_shop import ShopRAGMongo
import os
import time
from dotenv import load_dotenv
import asyncio

# === SỬA LỖI ĐƯỜNG DẪN ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PET_DATA_FILE = os.path.join(BASE_DIR, "pet_data.xlsx")
# ========================

# load env
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

if not GOOGLE_API_KEY:
    raise ValueError("Thiếu GOOGLE_API_KEY trong .env")
if not MONGO_URI:
    raise ValueError("Thiếu MONGO_URI trong .env")

app = FastAPI(title="TinyPaws Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Thêm 2 biến global để chứa mô hình ---
pet_rag: PetChatRAG | None = None
shop_rag: ShopRAGMongo | None = None
# ----------------------------------------

@app.on_event("startup")
async def load_models_on_startup():
    """
    Hàm này sẽ chạy SAU KHI port 10000 đã mở.
    Nó sẽ tải mô hình AI trong nền (background).
    """
    global pet_rag, shop_rag
    
    print("Đang khởi tạo mô hình chatbot...")
    start_time = time.time()

    # Sử dụng đường dẫn file đã sửa
    pet_rag = PetChatRAG(GOOGLE_API_KEY, PET_DATA_FILE)
    shop_rag = ShopRAGMongo(GOOGLE_API_KEY, MONGO_URI, db_name="TINYPAWS", collection="products")

    # Setup with caches
    # Chúng ta chạy 2 hàm này song song để tiết kiệm thời gian
    loop = asyncio.get_event_loop()
    await asyncio.gather(
        loop.run_in_executor(None, pet_rag.setup_with_cache),
        loop.run_in_executor(None, shop_rag.setup, True)
    )
    
    print(f"Tất cả chatbot đã sẵn sàng! ({round(time.time() - start_time, 2)}s)")

class ChatRequest(BaseModel):
    message: str

SHOP_KEYWORDS = [
    "shop", "cửa hàng", "địa chỉ", "vận chuyển", "ship", "giao hàng",
    "giá", "bán", "sản phẩm", "mua", "thanh toán", "khuyến mãi", "sale",
    "đổi trả", "hóa đơn", "tồn kho", "inventory", "order", "pay", "paypal"
]

def detect_query_type(message: str):
    msg = (message or "").lower()
    if any(kw in msg for kw in SHOP_KEYWORDS):
        return "shop"
    return "pet"

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not pet_rag or not shop_rag:
        return {"response": "Bot đang khởi động, vui lòng chờ 1-2 phút và thử lại...", "type": "loading"}

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
async def reindex_shop():
    if not shop_rag:
        return {"success": False, "error": "Bot chưa sẵn sàng"}
    try:
        shop_rag.reload_index()
        return {"success": True, "message": "Shop index reloaded"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/chat/pet")
async def chat_pet(req: ChatRequest):
    if not pet_rag:
        return {"response": "Bot đang khởi động, vui lòng chờ 1-2 phút và thử lại...", "type": "loading"}
    return pet_rag.chat(req.message)

@app.post("/chat/shop")
async def chat_shop(req: ChatRequest):
    if not shop_rag:
        return {"response": "Bot đang khởi động, vui lòng chờ 1-2 phút và thử lại...", "type": "loading"}
    return shop_rag.chat(req.message)

@app.get("/")
def root():
    return {"message": "TinyPaws Chatbot API đang hoạt động (Đang tải mô hình trong nền...)"}