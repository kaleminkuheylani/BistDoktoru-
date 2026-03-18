import { NextRequest, NextResponse } from 'next/server'
import { POPULAR_STOCKS, MOCK_STOCK_DATA } from '@/lib/stocks'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '1mo'

  // Map period to Yahoo Finance range
  const rangeMap: Record<string, string> = {
    '1d': '1d', '5d': '5d', '1mo': '1mo', '3mo': '3mo',
    '6mo': '6mo', '1y': '1y', '2y': '2y', '5y': '5y'
  }
  const range = rangeMap[period] || '1mo'

  // Try Yahoo Finance (free, no API key)
  try {
    const yfSymbol = `${symbol}.IS`
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=${range}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    )
    const data = await response.json()
    const result_data = data?.chart?.result?.[0]

    if (result_data) {
      const timestamps = result_data.timestamp
      const quotes = result_data.indicators?.quote?.[0]

      if (timestamps && quotes && timestamps.length > 0) {
        const history = timestamps.map((ts: number, i: number) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          open: Math.round((quotes.open[i] || 0) * 100) / 100,
          high: Math.round((quotes.high[i] || 0) * 100) / 100,
          low: Math.round((quotes.low[i] || 0) * 100) / 100,
          close: Math.round((quotes.close[i] || 0) * 100) / 100,
          volume: quotes.volume[i] || 0
        })).filter((d: any) => d.close > 0)

        return NextResponse.json({ symbol, period, data: history })
      }
    }
  } catch (error) {
    console.error('Yahoo Finance history error:', error)
  }

  // Fallback: mock historical data
  const basePrice = (MOCK_STOCK_DATA as Record<string, any>)[symbol]?.price || 100
  const periodDays: Record<string, number> = {
    '1d': 1, '5d': 5, '1mo': 30, '3mo': 90,
    '6mo': 180, '1y': 365, '2y': 730, '5y': 1825
  }
  const days = periodDays[period] || 30

  const history = []
  const now = new Date()

  for (let i = days; i > 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const variation = (Math.random() - 0.5) * 0.06
    const dayPrice = basePrice * (1 + (Math.random() - 0.5) * 0.2 + variation * (days - i) / days)

    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(dayPrice * (0.99 + Math.random() * 0.02) * 100) / 100,
      high: Math.round(dayPrice * (1.01 + Math.random() * 0.02) * 100) / 100,
      low: Math.round(dayPrice * (0.97 + Math.random() * 0.02) * 100) / 100,
      close: Math.round(dayPrice * 100) / 100,
      volume: Math.floor(Math.random() * 40000000) + 5000000
    })
  }

  return NextResponse.json({ symbol, period, data: history })
}
