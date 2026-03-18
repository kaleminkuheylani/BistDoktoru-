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
import yfinance as yf

# Cache for stock data to reduce API calls
stock_cache = {}
cache_timestamp = {}
CACHE_DURATION = 300  # 5 minutes cache to respect API limits

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

def _fetch_yf_quote_sync(symbol: str) -> Optional[dict]:
    """Synchronous yfinance quote fetch (runs in thread pool)"""
    yf_symbol = f"{symbol}.IS"
    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period="5d")
        if hist is not None and len(hist) >= 2:
            latest = hist.iloc[-1]
            prev = hist.iloc[-2]
            current_price = float(latest['Close'])
            prev_close = float(prev['Close'])
            change = current_price - prev_close
            change_percent = (change / prev_close * 100) if prev_close else 0
            fast_info = ticker.fast_info
            year_high = getattr(fast_info, 'year_high', None) or round(current_price * 1.2, 2)
            year_low = getattr(fast_info, 'year_low', None) or round(current_price * 0.8, 2)
            return {
                "symbol": symbol,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "high": round(float(latest['High']), 2),
                "low": round(float(latest['Low']), 2),
                "open_price": round(float(latest['Open']), 2),
                "close_price": round(prev_close, 2),
                "volume": int(latest['Volume']) if latest['Volume'] else 0,
                "fifty_two_week_high": round(float(year_high), 2),
                "fifty_two_week_low": round(float(year_low), 2),
            }
    except Exception as e:
        logging.warning(f"yfinance quote error for {symbol}: {e}")
    return None

async def fetch_yfinance_quote(symbol: str) -> Optional[dict]:
    """Fetch stock quote from Yahoo Finance (free, no API key required)"""
    cache_key = f"quote_{symbol}"
    if cache_key in stock_cache:
        if (datetime.now(timezone.utc).timestamp() - cache_timestamp.get(cache_key, 0)) < CACHE_DURATION:
            return stock_cache[cache_key]
    result = await asyncio.to_thread(_fetch_yf_quote_sync, symbol)
    if result:
        stock_cache[cache_key] = result
        cache_timestamp[cache_key] = datetime.now(timezone.utc).timestamp()
        logging.info(f"Got real data for {symbol} from Yahoo Finance")
    return result

async def fetch_stock_quote(symbol: str) -> Optional[dict]:
    """Fetch stock quote - tries Yahoo Finance first, then mock data"""
    result = await fetch_yfinance_quote(symbol)
    if result:
        return result
    logging.info(f"Using mock data for {symbol}")
    return get_mock_quote(symbol)

async def fetch_yahoo_quote(symbol: str) -> Optional[dict]:
    """Fetch stock quote - uses Twelve Data or mock fallback"""
    return await fetch_stock_quote(symbol)

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

def _fetch_yf_history_sync(symbol: str, period: str) -> List[dict]:
    """Synchronous yfinance history fetch (runs in thread pool)"""
    yf_symbol = f"{symbol}.IS"
    period_map = {
        "1d": "1d", "5d": "5d", "1mo": "1mo", "3mo": "3mo",
        "6mo": "6mo", "1y": "1y", "2y": "2y", "5y": "5y", "max": "max"
    }
    yf_period = period_map.get(period, "1mo")
    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=yf_period)
        if hist is not None and not hist.empty:
            history = []
            for idx, row in hist.iterrows():
                history.append({
                    "date": idx.strftime("%Y-%m-%d") if hasattr(idx, 'strftime') else str(idx)[:10],
                    "open": round(float(row['Open']), 2),
                    "high": round(float(row['High']), 2),
                    "low": round(float(row['Low']), 2),
                    "close": round(float(row['Close']), 2),
                    "volume": int(row['Volume']) if row['Volume'] else 0
                })
            logging.info(f"Got {len(history)} historical points for {symbol} from Yahoo Finance")
            return history
    except Exception as e:
        logging.warning(f"yfinance history error for {symbol}: {e}")
    return []

async def fetch_yahoo_history(symbol: str, period: str = "1mo") -> List[dict]:
    """Fetch historical data - tries Yahoo Finance first, then mock"""
    history = await asyncio.to_thread(_fetch_yf_history_sync, symbol, period)
    if history:
        return history
    
    # Fall back to mock data
    logging.info(f"Using mock historical data for {symbol}")
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
# Analysis Tools & Endpoints
# ========================

# Sector definitions for Turkish stocks
SECTOR_DATA = {
    "Havacılık": ["THYAO", "PGSUS"],
    "Finans": ["GARAN", "AKBNK", "ISCTR"],
    "Çelik": ["EREGL"],
    "Cam": ["SISE"],
    "Savunma": ["ASELS"],
    "Holding": ["KCHOL", "SAHOL"],
    "Enerji": ["TUPRS", "PETKM"],
    "Perakende": ["BIMAS"],
    "Telekomünikasyon": ["TCELL"],
    "Madencilik": ["KOZAL"],
    "Otomotiv": ["FROTO", "TOASO"],
    "Tarım": ["HEKTS"],
    "İnşaat": ["ENKAI"],
    "Beyaz Eşya": ["VESTL"]
}

# Reverse mapping: symbol to sector
SYMBOL_TO_SECTOR = {}
for sector, symbols in SECTOR_DATA.items():
    for symbol in symbols:
        SYMBOL_TO_SECTOR[symbol] = sector

async def get_sector_pe_analysis(sector: str = None) -> dict:
    """Calculate P/E ratios by sector"""
    all_stocks = []
    tasks = [fetch_yahoo_quote(s["symbol"]) for s in POPULAR_STOCKS]
    results = await asyncio.gather(*tasks)
    
    for stock_info, quote_data in zip(POPULAR_STOCKS, results):
        if quote_data:
            symbol = stock_info["symbol"]
            stock_sector = SYMBOL_TO_SECTOR.get(symbol, "Diğer")
            details = await fetch_yahoo_details(symbol)
            
            all_stocks.append({
                "symbol": symbol,
                "name": stock_info["name"],
                "sector": stock_sector,
                "price": quote_data.get("price", 0),
                "pe_ratio": details.get("pe_ratio") if details else None,
                "market_cap": details.get("market_cap") if details else None,
                "eps": details.get("eps") if details else None
            })
    
    # Group by sector
    sector_analysis = {}
    for stock in all_stocks:
        s = stock["sector"]
        if s not in sector_analysis:
            sector_analysis[s] = {"stocks": [], "avg_pe": 0, "total_market_cap": 0}
        sector_analysis[s]["stocks"].append(stock)
    
    # Calculate averages
    for s, data in sector_analysis.items():
        pe_values = [st["pe_ratio"] for st in data["stocks"] if st["pe_ratio"]]
        data["avg_pe"] = round(sum(pe_values) / len(pe_values), 2) if pe_values else 0
        data["total_market_cap"] = sum(st["market_cap"] or 0 for st in data["stocks"])
        data["stock_count"] = len(data["stocks"])
    
    if sector:
        return {sector: sector_analysis.get(sector, {})}
    return sector_analysis

async def get_stock_depth_analysis(symbol: str) -> dict:
    """Perform depth analysis on a stock"""
    symbol = symbol.upper()
    stock_info = next((s for s in POPULAR_STOCKS if s["symbol"] == symbol), None)
    
    if not stock_info:
        return {"error": "Hisse bulunamadı"}
    
    # Get current quote
    quote = await fetch_yahoo_quote(symbol)
    details = await fetch_yahoo_details(symbol)
    history = await fetch_yahoo_history(symbol, "3mo")
    
    if not quote:
        return {"error": "Veri alınamadı"}
    
    # Calculate technical indicators from history
    closes = [h["close"] for h in history] if history else []
    volumes = [h["volume"] for h in history] if history else []
    
    # Simple Moving Averages
    sma_20 = round(sum(closes[-20:]) / 20, 2) if len(closes) >= 20 else None
    sma_50 = round(sum(closes[-50:]) / 50, 2) if len(closes) >= 50 else None
    
    # Average volume
    avg_volume = int(sum(volumes[-20:]) / 20) if len(volumes) >= 20 else None
    
    # Volatility (standard deviation of returns)
    if len(closes) >= 20:
        returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
        volatility = round((sum((r - sum(returns)/len(returns))**2 for r in returns) / len(returns)) ** 0.5 * 100, 2)
    else:
        volatility = None
    
    # RSI calculation (simplified)
    if len(closes) >= 14:
        gains = []
        losses = []
        for i in range(1, 15):
            change = closes[-i] - closes[-i-1]
            if change > 0:
                gains.append(change)
            else:
                losses.append(abs(change))
        avg_gain = sum(gains) / 14
        avg_loss = sum(losses) / 14 if losses else 0.001
        rs = avg_gain / avg_loss
        rsi = round(100 - (100 / (1 + rs)), 2)
    else:
        rsi = None
    
    # Price position
    price = quote.get("price", 0)
    high_52w = quote.get("fifty_two_week_high", price)
    low_52w = quote.get("fifty_two_week_low", price)
    price_position = round((price - low_52w) / (high_52w - low_52w) * 100, 2) if high_52w != low_52w else 50
    
    # Sector comparison
    sector = SYMBOL_TO_SECTOR.get(symbol, "Diğer")
    sector_pe = await get_sector_pe_analysis(sector)
    sector_avg_pe = sector_pe.get(sector, {}).get("avg_pe", 0)
    
    pe_ratio = details.get("pe_ratio") if details else None
    pe_vs_sector = None
    if pe_ratio and sector_avg_pe:
        pe_vs_sector = "Ucuz" if pe_ratio < sector_avg_pe else "Pahalı"
    
    return {
        "symbol": symbol,
        "name": stock_info["name"],
        "sector": sector,
        "current_price": price,
        "change_percent": quote.get("change_percent", 0),
        
        # Fundamental Analysis
        "fundamental": {
            "pe_ratio": pe_ratio,
            "sector_avg_pe": sector_avg_pe,
            "pe_vs_sector": pe_vs_sector,
            "market_cap": details.get("market_cap") if details else None,
            "eps": details.get("eps") if details else None,
            "dividend_yield": details.get("dividend_yield") if details else None,
        },
        
        # Technical Analysis
        "technical": {
            "sma_20": sma_20,
            "sma_50": sma_50,
            "rsi": rsi,
            "rsi_signal": "Aşırı Alım" if rsi and rsi > 70 else ("Aşırı Satım" if rsi and rsi < 30 else "Nötr") if rsi else None,
            "volatility": volatility,
            "avg_volume_20d": avg_volume,
            "current_volume": quote.get("volume"),
            "volume_trend": "Yüksek" if quote.get("volume", 0) > (avg_volume or 0) * 1.5 else "Normal" if avg_volume else None,
        },
        
        # Price Analysis
        "price_analysis": {
            "52w_high": high_52w,
            "52w_low": low_52w,
            "price_position_52w": price_position,
            "position_text": "52 haftalık aralığın %{:.0f}'unda".format(price_position),
            "trend": "Yükseliş" if sma_20 and price > sma_20 else "Düşüş" if sma_20 else None,
        },
        
        "analysis_date": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Bu analiz eğitim amaçlıdır, yatırım tavsiyesi değildir."
    }

@api_router.get("/analysis/sector-pe")
async def api_sector_pe_analysis(sector: str = None):
    """Get P/E analysis by sector"""
    return await get_sector_pe_analysis(sector)

@api_router.get("/analysis/depth/{symbol}")
async def api_depth_analysis(symbol: str):
    """Get depth analysis for a stock"""
    return await get_stock_depth_analysis(symbol)

@api_router.get("/analysis/compare")
async def api_compare_stocks(symbols: str = Query(..., description="Comma-separated stock symbols")):
    """Compare multiple stocks"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")][:5]  # Max 5 stocks
    
    comparisons = []
    for symbol in symbol_list:
        analysis = await get_stock_depth_analysis(symbol)
        if "error" not in analysis:
            comparisons.append({
                "symbol": analysis["symbol"],
                "name": analysis["name"],
                "sector": analysis["sector"],
                "price": analysis["current_price"],
                "change_percent": analysis["change_percent"],
                "pe_ratio": analysis["fundamental"]["pe_ratio"],
                "rsi": analysis["technical"]["rsi"],
                "trend": analysis["price_analysis"]["trend"]
            })
    
    return {"stocks": comparisons, "count": len(comparisons)}

@api_router.get("/tools/price/{symbol}")
async def get_stock_price_tool(symbol: str):
    """Get current stock price - tool for chatbot"""
    quote = await fetch_yahoo_quote(symbol.upper())
    if quote:
        return {
            "symbol": symbol.upper(),
            "price": quote.get("price"),
            "change": quote.get("change"),
            "change_percent": quote.get("change_percent"),
            "high": quote.get("high"),
            "low": quote.get("low"),
            "volume": quote.get("volume")
        }
    return {"error": "Veri bulunamadı"}

@api_router.get("/tools/history/{symbol}")
async def get_stock_history_tool(symbol: str, period: str = "1mo"):
    """Get stock history - tool for chatbot"""
    history = await fetch_yahoo_history(symbol.upper(), period)
    if history:
        return {
            "symbol": symbol.upper(),
            "period": period,
            "data_points": len(history),
            "latest": history[-1] if history else None,
            "oldest": history[0] if history else None,
            "price_change": round(history[-1]["close"] - history[0]["close"], 2) if len(history) > 1 else 0,
            "price_change_percent": round((history[-1]["close"] - history[0]["close"]) / history[0]["close"] * 100, 2) if len(history) > 1 else 0
        }
    return {"error": "Geçmiş veri bulunamadı"}

# ========================
# Chatbot Endpoint with Tools
# ========================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    """Chat with AI stock market assistant with tool access"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    session_id = request.session_id or str(uuid.uuid4())
    user_msg = request.message.lower()
    
    # Check if user is asking about specific stock price
    context_data = ""
    
    # Detect stock symbols in message
    mentioned_symbols = [s["symbol"] for s in POPULAR_STOCKS if s["symbol"].lower() in user_msg or s["name"].lower() in user_msg]
    
    if mentioned_symbols:
        symbol = mentioned_symbols[0]
        
        # Check for specific queries
        if any(word in user_msg for word in ["fiyat", "kaç", "ne kadar", "değer"]):
            quote = await fetch_yahoo_quote(symbol)
            if quote:
                context_data = f"\n\n[GÜNCEL VERİ] {symbol} Hisse Bilgisi:\n- Fiyat: ₺{quote.get('price', 0)}\n- Değişim: %{quote.get('change_percent', 0)}\n- Günlük Yüksek: ₺{quote.get('high', 0)}\n- Günlük Düşük: ₺{quote.get('low', 0)}\n- Hacim: {quote.get('volume', 0):,}\n"
        
        elif any(word in user_msg for word in ["analiz", "değerlendir", "incele", "derinlik"]):
            analysis = await get_stock_depth_analysis(symbol)
            if "error" not in analysis:
                context_data = f"""
[DERİNLİK ANALİZİ] {symbol} - {analysis.get('name', '')}
Sektör: {analysis.get('sector', 'Bilinmiyor')}
Fiyat: ₺{analysis.get('current_price', 0)} ({analysis.get('change_percent', 0)}%)

TEMEL ANALİZ:
- F/K Oranı: {analysis['fundamental'].get('pe_ratio', 'N/A')}
- Sektör Ort. F/K: {analysis['fundamental'].get('sector_avg_pe', 'N/A')}
- Değerleme: {analysis['fundamental'].get('pe_vs_sector', 'N/A')}
- Piyasa Değeri: {analysis['fundamental'].get('market_cap', 'N/A')}

TEKNİK ANALİZ:
- RSI: {analysis['technical'].get('rsi', 'N/A')} ({analysis['technical'].get('rsi_signal', '')})
- 20 Günlük SMA: ₺{analysis['technical'].get('sma_20', 'N/A')}
- Volatilite: %{analysis['technical'].get('volatility', 'N/A')}
- Hacim Trendi: {analysis['technical'].get('volume_trend', 'N/A')}

FİYAT ANALİZİ:
- 52H Yüksek: ₺{analysis['price_analysis'].get('52w_high', 'N/A')}
- 52H Düşük: ₺{analysis['price_analysis'].get('52w_low', 'N/A')}
- Pozisyon: {analysis['price_analysis'].get('position_text', 'N/A')}
- Trend: {analysis['price_analysis'].get('trend', 'N/A')}
"""
        
        elif any(word in user_msg for word in ["geçmiş", "tarihçe", "history", "grafik"]):
            history = await fetch_yahoo_history(symbol, "1mo")
            if history:
                latest = history[-1] if history else {}
                oldest = history[0] if history else {}
                change = round(latest.get("close", 0) - oldest.get("close", 0), 2)
                change_pct = round(change / oldest.get("close", 1) * 100, 2)
                context_data = f"\n\n[GEÇMİŞ VERİ] {symbol} Son 1 Ay:\n- Başlangıç: ₺{oldest.get('close', 'N/A')} ({oldest.get('date', '')})\n- Son: ₺{latest.get('close', 'N/A')} ({latest.get('date', '')})\n- Değişim: ₺{change} (%{change_pct})\n- Veri Sayısı: {len(history)} gün\n"
    
    # Check for sector analysis
    if any(word in user_msg for word in ["sektör", "sektor", "karşılaştır", "f/k", "fk"]):
        sector_data = await get_sector_pe_analysis()
        sector_summary = "\n[SEKTÖR F/K ANALİZİ]\n"
        for sector, data in sorted(sector_data.items(), key=lambda x: x[1].get("avg_pe", 0) or 0):
            if data.get("avg_pe"):
                sector_summary += f"- {sector}: Ort. F/K {data['avg_pe']}, {data['stock_count']} hisse\n"
        context_data += sector_summary
    
    system_message = f"""Sen "Bist Doktoru", Türk borsası (BIST) konusunda uzman bir yapay zeka asistanısın.

KULLANDIĞIN ARAÇLAR:
1. Fiyat Sorgulama: Anlık hisse fiyatı, değişim, hacim bilgisi
2. Derinlik Analizi: F/K oranı, RSI, SMA, volatilite, sektör karşılaştırması
3. Geçmiş Veri: Tarihsel fiyat hareketleri
4. Sektör Analizi: Sektörel F/K karşılaştırması

Görevlerin:
- Türk borsası ve hisse senetleri hakkında sorulara yanıt vermek
- Temel analiz kavramlarını açıklamak (F/K oranı, piyasa değeri, temettü verimi vb.)
- Teknik analiz terimlerini basitçe anlatmak (RSI, SMA, destek/direnç)
- Sektörel karşılaştırmalar yapmak
- Genel yatırım stratejileri hakkında eğitici bilgi vermek

TAKİP EDİLEN HİSSELER: THYAO, GARAN, AKBNK, EREGL, SISE, ASELS, KCHOL, SAHOL, ISCTR, TUPRS, BIMAS, PGSUS, TCELL, KOZAL, FROTO, TOASO, PETKM, HEKTS, ENKAI, VESTL

ÖNEMLİ UYARILAR:
- Bu platform eğitim amaçlıdır, yatırım tavsiyesi değildir
- Kesinlikle "al" veya "sat" tavsiyesi verme
- Her zaman "yatırım kararlarınızı profesyonel danışmanlarla görüşerek verin" uyarısı ekle
- Türkçe yanıt ver
- Kısa ve öz ol
{context_data}"""

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
