from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
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

# --- Global models ---
pet_rag: PetChatRAG | None = None
shop_rag: ShopRAGMongo | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager thay thế cho on_event("startup")
    """
    global pet_rag, shop_rag
    
    print("🚀 Đang khởi tạo mô hình chatbot...")
    start_time = time.time()

    pet_rag = PetChatRAG(GOOGLE_API_KEY, PET_DATA_FILE)
    shop_rag = ShopRAGMongo(GOOGLE_API_KEY, MONGO_URI, db_name="TINYPAWS", collection="products")

    loop = asyncio.get_event_loop()
    await asyncio.gather(
        loop.run_in_executor(None, pet_rag.setup_with_cache),
        loop.run_in_executor(None, shop_rag.setup, True)
    )
    
    print(f"✅ Tất cả chatbot đã sẵn sàng! ({round(time.time() - start_time, 2)}s)")
    
    yield
    
    # Cleanup (nếu cần)
    print("🛑 Đang tắt chatbot...")

app = FastAPI(title="TinyPaws Chatbot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = None
    history: list = []

SHOP_KEYWORDS = [
    "shop", "cửa hàng", "địa chỉ", "vận chuyển", "ship", "giao hàng",
    "giá", "bán", "sản phẩm", "mua", "thanh toán", "khuyến mãi", "sale",
    "đổi trả", "hóa đơn", "tồn kho", "inventory", "order", "pay", "paypal",
    "gợi ý", "có", "không"
]

def detect_query_type(message: str):
    msg = (message or "").lower()
    if any(kw in msg for kw in SHOP_KEYWORDS):
        return "SHOP"
    return "PET"

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not pet_rag or not shop_rag:
        return {
            "response": "Bot đang khởi động, vui lòng chờ 1-2 phút và thử lại...",
            "type": "loading",
            "fallback": False
        }

    query = req.message.strip()
    query_type = detect_query_type(query)
    print(f"Loại câu hỏi: {query_type} | Câu: {query}")

    if query_type == "SHOP":
        result = shop_rag.chat(query, history=req.history)
    else:
        result = pet_rag.chat(query)

    return {
        "response": result["response"],
        "sources": result.get("sources", []),
        "fallback": result.get("fallback", False),
        "type": query_type,
        "time": result.get("processing_time", 0)
    }

@app.post("/admin/reindex/shop")
async def reindex_shop():
    if not shop_rag:
        return {"success": False, "error": "Bot chưa sẵn sàng"}
    try:
        print("🔄 Admin yêu cầu rebuild index...")
        shop_rag.reload_index()
        return {"success": True, "message": "Shop index đã được rebuild thành công"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/chat/pet")
async def chat_pet(req: ChatRequest):
    if not pet_rag:
        return {"response": "Bot đang khởi động...", "type": "loading"}
    return pet_rag.chat(req.message)

@app.post("/chat/shop")
async def chat_shop(req: ChatRequest):
    if not shop_rag:
        return {"response": "Bot đang khởi động...", "type": "loading"}
    return shop_rag.chat(req.message, history=req.history)

@app.get("/")
def root():
    status = "Sẵn sàng" if (pet_rag and shop_rag) else "Đang khởi tạo..."
    return {
        "message": f"TinyPaws Chatbot API - {status}",
        "version": "2.0"
    }

# ⭐ THÊM ENDPOINT MỚI: Rebuild + Xóa cache
@app.post("/admin/rebuild/shop")
async def rebuild_shop_from_scratch():
    """Force rebuild shop index từ đầu (xóa cache cũ)"""
    if not shop_rag:
        return {"success": False, "error": "Bot chưa sẵn sàng"}
    
    try:
        print("🔥 Đang xóa cache cũ và rebuild từ đầu...")
        
        # Xóa cache cũ
        import os
        if os.path.exists("shop_faiss.bin"):
            os.remove("shop_faiss.bin")
            print("✅ Đã xóa shop_faiss.bin")
        if os.path.exists("shop_cache.parquet"):
            os.remove("shop_cache.parquet")
            print("✅ Đã xóa shop_cache.parquet")
        
        # Rebuild từ đầu
        if shop_rag.load_data():
            shop_rag.build_index()
            shop_rag.save_cache()
            print(f"✅ Đã rebuild index với {len(shop_rag.df)} sản phẩm")
            return {
                "success": True, 
                "message": f"Đã rebuild thành công với {len(shop_rag.df)} sản phẩm"
            }
        else:
            return {"success": False, "error": "Không thể load data từ MongoDB"}
            
    except Exception as e:
        print(f"❌ Lỗi khi rebuild: {e}")
        return {"success": False, "error": str(e)}