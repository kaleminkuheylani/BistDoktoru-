import { NextRequest, NextResponse } from 'next/server'
import { POPULAR_STOCKS, MOCK_STOCK_DATA } from '@/lib/stocks'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '1mo'
  
  const apiKey = process.env.TWELVE_DATA_API_KEY
  
  // Map period to outputsize
  const periodMap: Record<string, number> = {
    '1d': 1, '5d': 5, '1mo': 22, '3mo': 66,
    '6mo': 132, '1y': 252, '2y': 504, '5y': 1260
  }
  const outputsize = periodMap[period] || 22
  
  // Try Twelve Data API first
  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&exchange=XIST&interval=1day&outputsize=${outputsize}&apikey=${apiKey}`
      )
      const data = await response.json()
      
      if (data.values && data.values.length > 0) {
        const history = data.values.map((v: any) => ({
          date: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: parseInt(v.volume || '0')
        })).reverse()
        
        return NextResponse.json({
          symbol,
          period,
          data: history
        })
      }
    } catch (error) {
      console.error('Twelve Data history error:', error)
    }
  }
  
  // Generate mock historical data
  const basePrice = MOCK_STOCK_DATA[symbol]?.price || 100
  const periodDays: Record<string, number> = {
    '1d': 1, '5d': 5, '1mo': 30, '3mo': 90,
    '6mo': 180, '1y': 365
  }
  const days = periodDays[period] || 30
  
  const history = []
  const now = new Date()
  
  for (let i = days; i > 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Skip weekends
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
  
  return NextResponse.json({
    symbol,
    period,
    data: history
  })
}
