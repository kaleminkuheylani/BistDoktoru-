import { NextRequest, NextResponse } from 'next/server'
import { POPULAR_STOCKS, getMockQuote } from '@/lib/stocks'

// Cache for Yahoo Finance data
const stockCache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_DURATION = 300000 // 5 minutes

async function fetchYahooQuote(symbol: string) {
  const cacheKey = `quote_${symbol}`
  const cached = stockCache[cacheKey]

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const yfSymbol = `${symbol}.IS`
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    )
    const data = await response.json()
    const result_data = data?.chart?.result?.[0]
    if (!result_data) return null

    const meta = result_data.meta
    const quotes = result_data.indicators?.quote?.[0]
    const timestamps = result_data.timestamp

    if (!quotes || !timestamps || timestamps.length < 2) return null

    const lastIdx = timestamps.length - 1
    const prevIdx = lastIdx - 1

    const currentPrice = quotes.close[lastIdx]
    const prevClose = quotes.close[prevIdx]
    if (!currentPrice || !prevClose) return null

    const change = currentPrice - prevClose
    const changePercent = (change / prevClose) * 100
    const stockInfo = POPULAR_STOCKS.find(s => s.symbol === symbol)

    const result = {
      symbol,
      name: stockInfo?.name || symbol,
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      change_percent: Math.round(changePercent * 100) / 100,
      high: Math.round((quotes.high[lastIdx] || currentPrice) * 100) / 100,
      low: Math.round((quotes.low[lastIdx] || currentPrice) * 100) / 100,
      open_price: Math.round((quotes.open[lastIdx] || currentPrice) * 100) / 100,
      close_price: Math.round(prevClose * 100) / 100,
      volume: quotes.volume[lastIdx] || 0,
      fifty_two_week_high: Math.round((meta.fiftyTwoWeekHigh || currentPrice * 1.2) * 100) / 100,
      fifty_two_week_low: Math.round((meta.fiftyTwoWeekLow || currentPrice * 0.8) * 100) / 100,
    }

    stockCache[cacheKey] = { data: result, timestamp: Date.now() }
    return result
  } catch (error) {
    console.error(`Yahoo Finance error for ${symbol}:`, error)
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
        const yahooData = await fetchYahooQuote(stock.symbol)
        return yahooData || getMockQuote(stock.symbol)
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
