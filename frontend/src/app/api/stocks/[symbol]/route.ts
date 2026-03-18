import { NextRequest, NextResponse } from 'next/server'
import { POPULAR_STOCKS, getMockQuote, SYMBOL_TO_SECTOR, MOCK_STOCK_DATA } from '@/lib/stocks'

// Cache for Twelve Data API
const stockCache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_DURATION = 300000 // 5 minutes

async function fetchTwelveDataQuote(symbol: string) {
  const cacheKey = `quote_${symbol}`
  const cached = stockCache[cacheKey]
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) return null
  
  try {
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&exchange=XIST&interval=1day&outputsize=2&apikey=${apiKey}`
    )
    const data = await response.json()
    
    if (data.values && data.values.length > 0) {
      const latest = data.values[0]
      const prev = data.values[1] || data.values[0]
      
      const currentPrice = parseFloat(latest.close)
      const prevClose = parseFloat(prev.close)
      const change = currentPrice - prevClose
      const changePercent = (change / prevClose) * 100
      
      const stockInfo = POPULAR_STOCKS.find(s => s.symbol === symbol)
      
      const result = {
        symbol,
        name: stockInfo?.name || symbol,
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        change_percent: Math.round(changePercent * 100) / 100,
        high: Math.round(parseFloat(latest.high) * 100) / 100,
        low: Math.round(parseFloat(latest.low) * 100) / 100,
        open_price: Math.round(parseFloat(latest.open) * 100) / 100,
        close_price: Math.round(prevClose * 100) / 100,
        volume: parseInt(latest.volume || '0'),
        fifty_two_week_high: Math.round(currentPrice * 1.2 * 100) / 100,
        fifty_two_week_low: Math.round(currentPrice * 0.8 * 100) / 100,
      }
      
      stockCache[cacheKey] = { data: result, timestamp: Date.now() }
      return result
    }
  } catch (error) {
    console.error(`Twelve Data error for ${symbol}:`, error)
  }
  
  return null
}

// Mock fundamental data
const MOCK_FUNDAMENTALS: Record<string, any> = {
  "THYAO": { market_cap: 285000000000, pe_ratio: 8.5, eps: 37.15, dividend_yield: 0.02, sector: "Havacılık", industry: "Havayolları" },
  "GARAN": { market_cap: 540000000000, pe_ratio: 4.2, eps: 30.57, dividend_yield: 0.08, sector: "Finans", industry: "Bankacılık" },
  "AKBNK": { market_cap: 310000000000, pe_ratio: 3.8, eps: 15.46, dividend_yield: 0.07, sector: "Finans", industry: "Bankacılık" },
  "ASELS": { market_cap: 156000000000, pe_ratio: 22.5, eps: 3.48, dividend_yield: 0.01, sector: "Savunma", industry: "Savunma Teknolojileri" },
  "BIMAS": { market_cap: 295000000000, pe_ratio: 28.4, eps: 17.08, dividend_yield: 0.02, sector: "Perakende", industry: "Market Zincirleri" },
  "PGSUS": { market_cap: 86000000000, pe_ratio: 12.3, eps: 68.50, dividend_yield: 0.0, sector: "Havacılık", industry: "Düşük Maliyetli Havayolları" },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase()
  const stockInfo = POPULAR_STOCKS.find(s => s.symbol === symbol)
  
  if (!stockInfo) {
    return NextResponse.json({ error: 'Hisse bulunamadı' }, { status: 404 })
  }
  
  try {
    const quote = await fetchTwelveDataQuote(symbol) || getMockQuote(symbol)
    
    const fundamentals = MOCK_FUNDAMENTALS[symbol] || {
      market_cap: Math.floor(Math.random() * 200000000000) + 50000000000,
      pe_ratio: Math.round((5 + Math.random() * 20) * 100) / 100,
      eps: Math.round((2 + Math.random() * 40) * 100) / 100,
      dividend_yield: Math.round(Math.random() * 0.08 * 1000) / 1000,
      sector: SYMBOL_TO_SECTOR[symbol] || "Endüstriyel",
      industry: "Çeşitli"
    }
    
    return NextResponse.json({
      ...quote,
      ...fundamentals,
      average_volume: Math.floor(Math.random() * 40000000) + 5000000,
      beta: Math.round((0.8 + Math.random() * 0.7) * 100) / 100,
      description: `${symbol} Borsa İstanbul'da işlem gören bir Türk şirketidir. Bu veriler eğitim amaçlıdır.`
    })
  } catch (error) {
    console.error('Error fetching stock detail:', error)
    return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 })
  }
}
