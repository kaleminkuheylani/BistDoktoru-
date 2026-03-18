import { NextRequest, NextResponse } from 'next/server'
import { POPULAR_STOCKS, getMockQuote, MOCK_STOCK_DATA } from '@/lib/stocks'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'popular'
  const limit = parseInt(searchParams.get('limit') || '10')
  
  try {
    const stocks = await Promise.all(
      POPULAR_STOCKS.slice(0, type === 'all' ? 20 : 10).map(async (stock) => {
        const twelveData = await fetchTwelveDataQuote(stock.symbol)
        return twelveData || getMockQuote(stock.symbol)
      })
    )
    
    if (type === 'gainers') {
      const sorted = [...stocks].sort((a, b) => b.change_percent - a.change_percent)
      return NextResponse.json(sorted.slice(0, limit))
    }
    
    if (type === 'losers') {
      const sorted = [...stocks].sort((a, b) => a.change_percent - b.change_percent)
      return NextResponse.json(sorted.slice(0, limit))
    }
    
    return NextResponse.json(stocks)
  } catch (error) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json(
      POPULAR_STOCKS.slice(0, 10).map(s => getMockQuote(s.symbol))
    )
  }
}
