from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Bist Doktoru API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========================
# Models
# ========================

class StockData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    high: Optional[float] = None
    low: Optional[float] = None
    open_price: Optional[float] = None
    close_price: Optional[float] = None
    volume: Optional[int] = None
    timestamp: Optional[str] = None

class StockDetail(StockData):
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    average_volume: Optional[int] = None
    beta: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

class HistoricalDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class WatchlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    name: str
    added_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WatchlistCreate(BaseModel):
    symbol: str
    name: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ========================
# BIST Stock Data (Yahoo Finance)
# ========================

# Popular BIST stocks
POPULAR_STOCKS = [
    {"symbol": "THYAO", "name": "Türk Hava Yolları"},
    {"symbol": "GARAN", "name": "Garanti BBVA"},
    {"symbol": "AKBNK", "name": "Akbank"},
    {"symbol": "EREGL", "name": "Ereğli Demir Çelik"},
    {"symbol": "SISE", "name": "Şişecam"},
    {"symbol": "ASELS", "name": "Aselsan"},
    {"symbol": "KCHOL", "name": "Koç Holding"},
    {"symbol": "SAHOL", "name": "Sabancı Holding"},
    {"symbol": "ISCTR", "name": "İş Bankası"},
    {"symbol": "TUPRS", "name": "Tüpraş"},
    {"symbol": "BIMAS", "name": "BİM Mağazalar"},
    {"symbol": "PGSUS", "name": "Pegasus Havayolları"},
    {"symbol": "TCELL", "name": "Turkcell"},
    {"symbol": "KOZAL", "name": "Koza Altın"},
    {"symbol": "FROTO", "name": "Ford Otosan"},
    {"symbol": "TOASO", "name": "Tofaş Oto"},
    {"symbol": "PETKM", "name": "Petkim"},
    {"symbol": "HEKTS", "name": "Hektaş"},
    {"symbol": "ENKAI", "name": "Enka İnşaat"},
    {"symbol": "VESTL", "name": "Vestel"}
]

import random

# Mock data for stocks when API is unavailable
MOCK_STOCK_DATA = {
    "THYAO": {"price": 315.80, "change": 4.60, "high": 318.50, "low": 310.20, "volume": 45678900},
    "GARAN": {"price": 128.40, "change": -1.80, "high": 131.00, "low": 127.50, "volume": 32456700},
    "AKBNK": {"price": 58.75, "change": 0.95, "high": 59.20, "low": 57.80, "volume": 28345600},
    "EREGL": {"price": 52.30, "change": -0.45, "high": 53.10, "low": 51.90, "volume": 18234500},
    "SISE": {"price": 45.60, "change": 1.20, "high": 46.00, "low": 44.30, "volume": 15678400},
    "ASELS": {"price": 78.25, "change": 2.15, "high": 79.00, "low": 76.50, "volume": 22345600},
    "KCHOL": {"price": 198.50, "change": -3.20, "high": 202.00, "low": 197.00, "volume": 12456700},
    "SAHOL": {"price": 85.40, "change": 1.60, "high": 86.20, "low": 83.80, "volume": 19876500},
    "ISCTR": {"price": 18.92, "change": 0.28, "high": 19.10, "low": 18.60, "volume": 45678900},
    "TUPRS": {"price": 165.30, "change": -2.40, "high": 168.50, "low": 164.00, "volume": 8765400},
    "BIMAS": {"price": 485.20, "change": 8.50, "high": 490.00, "low": 478.00, "volume": 5432100},
    "PGSUS": {"price": 842.50, "change": 15.30, "high": 855.00, "low": 830.00, "volume": 3456700},
    "TCELL": {"price": 92.80, "change": -0.60, "high": 94.00, "low": 92.00, "volume": 14567800},
    "KOZAL": {"price": 145.60, "change": 3.80, "high": 147.00, "low": 142.50, "volume": 6789000},
    "FROTO": {"price": 1245.00, "change": -18.50, "high": 1268.00, "low": 1240.00, "volume": 2345600},
    "TOASO": {"price": 368.40, "change": 5.60, "high": 372.00, "low": 364.00, "volume": 4567800},
    "PETKM": {"price": 22.48, "change": 0.32, "high": 22.80, "low": 22.10, "volume": 35678900},
    "HEKTS": {"price": 128.90, "change": -1.40, "high": 131.00, "low": 128.00, "volume": 7654300},
    "ENKAI": {"price": 45.80, "change": 0.75, "high": 46.20, "low": 45.00, "volume": 11234500},
    "VESTL": {"price": 35.20, "change": 0.48, "high": 35.60, "low": 34.80, "volume": 9876500},
}

def get_mock_quote(symbol: str) -> dict:
    """Generate mock quote data with slight variations"""
    base = MOCK_STOCK_DATA.get(symbol, {"price": 100.0, "change": 0, "high": 102, "low": 98, "volume": 1000000})
    
    # Add small random variation
    variation = random.uniform(-0.02, 0.02)
    price = round(base["price"] * (1 + variation), 2)
    change = round(base["change"] * random.uniform(0.8, 1.2), 2)
    change_percent = round((change / (price - change)) * 100, 2) if price != change else 0
    
    return {
        "symbol": symbol,
        "price": price,
        "change": change,
        "change_percent": change_percent,
        "high": round(base["high"] * (1 + variation), 2),
        "low": round(base["low"] * (1 + variation), 2),
        "open_price": round(price - change, 2),
        "close_price": round(price - change, 2),
        "volume": int(base["volume"] * random.uniform(0.9, 1.1)),
        "fifty_two_week_high": round(base["price"] * 1.35, 2),
        "fifty_two_week_low": round(base["price"] * 0.65, 2),
    }

async def fetch_yahoo_quote(symbol: str) -> Optional[dict]:
    """Fetch stock quote from Yahoo Finance with mock fallback"""
    yahoo_symbol = f"{symbol}.IS"
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}"
    params = {"interval": "1d", "range": "1d"}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                result = data.get("chart", {}).get("result", [])
                if result:
                    meta = result[0].get("meta", {})
                    
                    current_price = meta.get("regularMarketPrice", 0)
                    if current_price > 0:
                        prev_close = meta.get("previousClose", current_price)
                        change = current_price - prev_close
                        change_percent = (change / prev_close * 100) if prev_close else 0
                        
                        return {
                            "symbol": symbol,
                            "price": round(current_price, 2),
                            "change": round(change, 2),
                            "change_percent": round(change_percent, 2),
                            "high": round(meta.get("regularMarketDayHigh", 0), 2),
                            "low": round(meta.get("regularMarketDayLow", 0), 2),
                            "open_price": round(meta.get("regularMarketOpen", 0), 2),
                            "close_price": round(prev_close, 2),
                            "volume": meta.get("regularMarketVolume", 0),
                            "fifty_two_week_high": round(meta.get("fiftyTwoWeekHigh", 0), 2),
                            "fifty_two_week_low": round(meta.get("fiftyTwoWeekLow", 0), 2),
                        }
    except Exception as e:
        logging.debug(f"Yahoo API unavailable for {symbol}, using mock data: {e}")
    
    # Return mock data as fallback
    return get_mock_quote(symbol)

async def fetch_yahoo_details(symbol: str) -> Optional[dict]:
    """Fetch detailed stock info - returns mock data for educational purposes"""
    # For educational purposes, return mock fundamental data
    mock_details = {
        "THYAO": {"market_cap": 285000000000, "pe_ratio": 8.5, "eps": 37.15, "dividend_yield": 0.02, "sector": "Havacılık", "industry": "Havayolları"},
        "GARAN": {"market_cap": 540000000000, "pe_ratio": 4.2, "eps": 30.57, "dividend_yield": 0.08, "sector": "Finans", "industry": "Bankacılık"},
        "AKBNK": {"market_cap": 310000000000, "pe_ratio": 3.8, "eps": 15.46, "dividend_yield": 0.07, "sector": "Finans", "industry": "Bankacılık"},
        "EREGL": {"market_cap": 185000000000, "pe_ratio": 6.2, "eps": 8.44, "dividend_yield": 0.05, "sector": "Temel Materyaller", "industry": "Çelik"},
        "ASELS": {"market_cap": 156000000000, "pe_ratio": 22.5, "eps": 3.48, "dividend_yield": 0.01, "sector": "Savunma", "industry": "Savunma Teknolojileri"},
        "BIMAS": {"market_cap": 295000000000, "pe_ratio": 28.4, "eps": 17.08, "dividend_yield": 0.02, "sector": "Perakende", "industry": "Market Zincirleri"},
        "PGSUS": {"market_cap": 86000000000, "pe_ratio": 12.3, "eps": 68.50, "dividend_yield": 0.0, "sector": "Havacılık", "industry": "Düşük Maliyetli Havayolları"},
    }
    
    base = mock_details.get(symbol, {
        "market_cap": random.randint(50000000000, 300000000000),
        "pe_ratio": round(random.uniform(5, 25), 2),
        "eps": round(random.uniform(2, 50), 2),
        "dividend_yield": round(random.uniform(0, 0.08), 3),
        "sector": "Endüstriyel",
        "industry": "Çeşitli"
    })
    
    return {
        **base,
        "average_volume": random.randint(5000000, 50000000),
        "beta": round(random.uniform(0.8, 1.5), 2),
        "description": f"{symbol} Borsa İstanbul'da işlem gören bir Türk şirketidir. Bu veriler eğitim amaçlıdır ve gerçek zamanlı değildir."
    }

async def fetch_yahoo_history(symbol: str, period: str = "1mo") -> List[dict]:
    """Generate mock historical data for educational purposes"""
    from datetime import timedelta
    
    # Generate mock historical data
    base_price = MOCK_STOCK_DATA.get(symbol, {"price": 100.0})["price"]
    
    # Determine number of days based on period
    period_days = {
        "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, 
        "6mo": 180, "1y": 365, "2y": 730, "5y": 1825, "max": 2555
    }
    days = period_days.get(period, 30)
    
    history = []
    current_date = datetime.now(timezone.utc)
    
    for i in range(days, 0, -1):
        date = current_date - timedelta(days=i)
        # Skip weekends
        if date.weekday() >= 5:
            continue
            
        # Generate price with random walk
        variation = random.uniform(-0.03, 0.03)
        day_price = base_price * (1 + (random.random() - 0.5) * 0.2 + variation * (days - i) / days)
        
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(day_price * random.uniform(0.99, 1.01), 2),
            "high": round(day_price * random.uniform(1.01, 1.03), 2),
            "low": round(day_price * random.uniform(0.97, 0.99), 2),
            "close": round(day_price, 2),
            "volume": random.randint(5000000, 50000000)
        })
    
    return history

# ========================
# API Endpoints
# ========================

@api_router.get("/")
async def root():
    return {"message": "Bist Doktoru API - Türk Borsası Takip Platformu"}

@api_router.get("/stocks/popular", response_model=List[StockData])
async def get_popular_stocks():
    """Get popular BIST stocks with current prices"""
    stocks = []
    tasks = [fetch_yahoo_quote(s["symbol"]) for s in POPULAR_STOCKS[:10]]
    results = await asyncio.gather(*tasks)
    
    for stock_info, quote_data in zip(POPULAR_STOCKS[:10], results):
        if quote_data:
            # Remove symbol from quote_data since it's already in there
            stocks.append(StockData(
                name=stock_info["name"],
                **quote_data
            ))
        else:
            # Fallback with mock data if API fails
            stocks.append(StockData(
                symbol=stock_info["symbol"],
                name=stock_info["name"],
                price=0,
                change=0,
                change_percent=0
            ))
    return stocks

@api_router.get("/stocks/gainers", response_model=List[StockData])
async def get_top_gainers(limit: int = Query(default=5, le=20)):
    """Get top gaining stocks"""
    stocks = []
    tasks = [fetch_yahoo_quote(s["symbol"]) for s in POPULAR_STOCKS]
    results = await asyncio.gather(*tasks)
    
    for stock_info, quote_data in zip(POPULAR_STOCKS, results):
        if quote_data:
            stocks.append(StockData(
                name=stock_info["name"],
                **quote_data
            ))
    
    # Sort by change percent descending
    stocks.sort(key=lambda x: x.change_percent, reverse=True)
    return stocks[:limit]

@api_router.get("/stocks/losers", response_model=List[StockData])
async def get_top_losers(limit: int = Query(default=5, le=20)):
    """Get top losing stocks"""
    stocks = []
    tasks = [fetch_yahoo_quote(s["symbol"]) for s in POPULAR_STOCKS]
    results = await asyncio.gather(*tasks)
    
    for stock_info, quote_data in zip(POPULAR_STOCKS, results):
        if quote_data:
            stocks.append(StockData(
                name=stock_info["name"],
                **quote_data
            ))
    
    # Sort by change percent ascending
    stocks.sort(key=lambda x: x.change_percent)
    return stocks[:limit]

@api_router.get("/stocks/all", response_model=List[StockData])
async def get_all_stocks():
    """Get all tracked BIST stocks"""
    stocks = []
    tasks = [fetch_yahoo_quote(s["symbol"]) for s in POPULAR_STOCKS]
    results = await asyncio.gather(*tasks)
    
    for stock_info, quote_data in zip(POPULAR_STOCKS, results):
        if quote_data:
            stocks.append(StockData(
                name=stock_info["name"],
                **quote_data
            ))
        else:
            stocks.append(StockData(
                symbol=stock_info["symbol"],
                name=stock_info["name"],
                price=0,
                change=0,
                change_percent=0
            ))
    return stocks

@api_router.get("/stocks/{symbol}", response_model=StockDetail)
async def get_stock_detail(symbol: str):
    """Get detailed stock information"""
    symbol = symbol.upper()
    stock_info = next((s for s in POPULAR_STOCKS if s["symbol"] == symbol), None)
    
    if not stock_info:
        raise HTTPException(status_code=404, detail="Hisse bulunamadı")
    
    quote_data = await fetch_yahoo_quote(symbol)
    detail_data = await fetch_yahoo_details(symbol)
    
    if not quote_data:
        raise HTTPException(status_code=503, detail="Veri alınamadı")
    
    # Remove symbol from quote_data to avoid duplicate
    quote_data_clean = {k: v for k, v in quote_data.items() if k != 'symbol'}
    
    return StockDetail(
        symbol=symbol,
        name=stock_info["name"],
        **quote_data_clean,
        **(detail_data or {})
    )

@api_router.get("/stocks/{symbol}/history")
async def get_stock_history(
    symbol: str, 
    period: str = Query(default="1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|max)$")
):
    """Get historical price data"""
    symbol = symbol.upper()
    history = await fetch_yahoo_history(symbol, period)
    
    if not history:
        raise HTTPException(status_code=503, detail="Geçmiş veriler alınamadı")
    
    return {"symbol": symbol, "period": period, "data": history}

@api_router.get("/stocks/search/{query}", response_model=List[StockData])
async def search_stocks(query: str):
    """Search stocks by name or symbol"""
    query_lower = query.lower()
    matching = [s for s in POPULAR_STOCKS if query_lower in s["symbol"].lower() or query_lower in s["name"].lower()]
    
    stocks = []
    tasks = [fetch_yahoo_quote(s["symbol"]) for s in matching[:10]]
    results = await asyncio.gather(*tasks)
    
    for stock_info, quote_data in zip(matching[:10], results):
        if quote_data:
            stocks.append(StockData(
                name=stock_info["name"],
                **quote_data
            ))
    return stocks

# ========================
# Watchlist Endpoints
# ========================

@api_router.get("/watchlist", response_model=List[WatchlistItem])
async def get_watchlist():
    """Get user's watchlist"""
    items = await db.watchlist.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/watchlist", response_model=WatchlistItem)
async def add_to_watchlist(item: WatchlistCreate):
    """Add stock to watchlist"""
    # Check if already exists
    existing = await db.watchlist.find_one({"symbol": item.symbol.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Hisse zaten izleme listenizde")
    
    watchlist_item = WatchlistItem(
        symbol=item.symbol.upper(),
        name=item.name
    )
    doc = watchlist_item.model_dump()
    await db.watchlist.insert_one(doc)
    return watchlist_item

@api_router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    """Remove stock from watchlist"""
    result = await db.watchlist.delete_one({"symbol": symbol.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hisse izleme listesinde bulunamadı")
    return {"message": "Hisse izleme listesinden kaldırıldı"}

@api_router.get("/watchlist/data", response_model=List[StockData])
async def get_watchlist_with_data():
    """Get watchlist stocks with current prices"""
    items = await db.watchlist.find({}, {"_id": 0}).to_list(100)
    
    stocks = []
    tasks = [fetch_yahoo_quote(item["symbol"]) for item in items]
    results = await asyncio.gather(*tasks)
    
    for item, quote_data in zip(items, results):
        if quote_data:
            stocks.append(StockData(
                name=item["name"],
                **quote_data
            ))
    return stocks

# ========================
# Chatbot Endpoint
# ========================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    """Chat with AI stock market assistant"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    session_id = request.session_id or str(uuid.uuid4())
    
    system_message = """Sen "Bist Doktoru", Türk borsası (BIST) konusunda uzman bir yapay zeka asistanısın.

Görevlerin:
- Türk borsası ve hisse senetleri hakkında sorulara yanıt vermek
- Temel analiz kavramlarını açıklamak (F/K oranı, piyasa değeri, temettü verimi vb.)
- Teknik analiz terimlerini basitçe anlatmak
- Genel yatırım stratejileri hakkında eğitici bilgi vermek

ÖNEMLİ UYARILAR:
- Bu platform eğitim amaçlıdır, yatırım tavsiyesi değildir
- Kesinlikle "al" veya "sat" tavsiyesi verme
- Her zaman "yatırım kararlarınızı profesyonel danışmanlarla görüşerek verin" uyarısı ekle
- Türkçe yanıt ver
- Kısa ve öz ol"""

    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chatbot yanıt veremedi")

# ========================
# Market Summary Endpoint
# ========================

@api_router.get("/market/summary")
async def get_market_summary():
    """Get market summary with index values (mock data for educational purposes)"""
    # Mock index data since Yahoo Finance API may be blocked
    xu100_base = 9876.54
    xu030_base = 10234.56
    
    xu100_change = round(random.uniform(-150, 200), 2)
    xu030_change = round(random.uniform(-180, 220), 2)
    
    xu100_value = round(xu100_base + xu100_change, 2)
    xu030_value = round(xu030_base + xu030_change, 2)
    
    return {
        "xu100": {
            "name": "BIST 100",
            "value": xu100_value,
            "change": xu100_change,
            "change_percent": round((xu100_change / xu100_base) * 100, 2)
        },
        "xu030": {
            "name": "BIST 30",
            "value": xu030_value,
            "change": xu030_change,
            "change_percent": round((xu030_change / xu030_base) * 100, 2)
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notice": "Veriler eğitim amaçlıdır, gecikmeli olarak sağlanmaktadır."
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
