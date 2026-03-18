// Stock data types
export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  change_percent: number
  high?: number
  low?: number
  open_price?: number
  close_price?: number
  volume?: number
  fifty_two_week_high?: number
  fifty_two_week_low?: number
}

export interface StockDetail extends StockData {
  market_cap?: number
  pe_ratio?: number
  eps?: number
  dividend_yield?: number
  average_volume?: number
  beta?: number
  sector?: string
  industry?: string
  description?: string
}

export interface HistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketSummary {
  xu100: { name: string; value: number; change: number; change_percent: number }
  xu030: { name: string; value: number; change: number; change_percent: number }
  timestamp: string
}

export interface DepthAnalysis {
  symbol: string
  name: string
  sector: string
  current_price: number
  change_percent: number
  fundamental: {
    pe_ratio: number | null
    sector_avg_pe: number | null
    pe_vs_sector: string | null
    market_cap: number | null
    eps: number | null
    dividend_yield: number | null
  }
  technical: {
    sma_20: number | null
    sma_50: number | null
    rsi: number | null
    rsi_signal: string | null
    volatility: number | null
    avg_volume_20d: number | null
    current_volume: number | null
    volume_trend: string | null
  }
  price_analysis: {
    "52w_high": number
    "52w_low": number
    price_position_52w: number
    position_text: string
    trend: string | null
  }
}

// Popular BIST stocks
export const POPULAR_STOCKS = [
  { symbol: "THYAO", name: "Türk Hava Yolları" },
  { symbol: "GARAN", name: "Garanti BBVA" },
  { symbol: "AKBNK", name: "Akbank" },
  { symbol: "EREGL", name: "Ereğli Demir Çelik" },
  { symbol: "SISE", name: "Şişecam" },
  { symbol: "ASELS", name: "Aselsan" },
  { symbol: "KCHOL", name: "Koç Holding" },
  { symbol: "SAHOL", name: "Sabancı Holding" },
  { symbol: "ISCTR", name: "İş Bankası" },
  { symbol: "TUPRS", name: "Tüpraş" },
  { symbol: "BIMAS", name: "BİM Mağazalar" },
  { symbol: "PGSUS", name: "Pegasus Havayolları" },
  { symbol: "TCELL", name: "Turkcell" },
  { symbol: "KOZAL", name: "Koza Altın" },
  { symbol: "FROTO", name: "Ford Otosan" },
  { symbol: "TOASO", name: "Tofaş Oto" },
  { symbol: "PETKM", name: "Petkim" },
  { symbol: "HEKTS", name: "Hektaş" },
  { symbol: "ENKAI", name: "Enka İnşaat" },
  { symbol: "VESTL", name: "Vestel" },
]

// Mock stock data
export const MOCK_STOCK_DATA: Record<string, { price: number; change: number; high: number; low: number; volume: number }> = {
  "THYAO": { price: 315.80, change: 4.60, high: 318.50, low: 310.20, volume: 45678900 },
  "GARAN": { price: 128.40, change: -1.80, high: 131.00, low: 127.50, volume: 32456700 },
  "AKBNK": { price: 58.75, change: 0.95, high: 59.20, low: 57.80, volume: 28345600 },
  "EREGL": { price: 52.30, change: -0.45, high: 53.10, low: 51.90, volume: 18234500 },
  "SISE": { price: 45.60, change: 1.20, high: 46.00, low: 44.30, volume: 15678400 },
  "ASELS": { price: 78.25, change: 2.15, high: 79.00, low: 76.50, volume: 22345600 },
  "KCHOL": { price: 198.50, change: -3.20, high: 202.00, low: 197.00, volume: 12456700 },
  "SAHOL": { price: 85.40, change: 1.60, high: 86.20, low: 83.80, volume: 19876500 },
  "ISCTR": { price: 18.92, change: 0.28, high: 19.10, low: 18.60, volume: 45678900 },
  "TUPRS": { price: 165.30, change: -2.40, high: 168.50, low: 164.00, volume: 8765400 },
  "BIMAS": { price: 485.20, change: 8.50, high: 490.00, low: 478.00, volume: 5432100 },
  "PGSUS": { price: 842.50, change: 15.30, high: 855.00, low: 830.00, volume: 3456700 },
  "TCELL": { price: 92.80, change: -0.60, high: 94.00, low: 92.00, volume: 14567800 },
  "KOZAL": { price: 145.60, change: 3.80, high: 147.00, low: 142.50, volume: 6789000 },
  "FROTO": { price: 1245.00, change: -18.50, high: 1268.00, low: 1240.00, volume: 2345600 },
  "TOASO": { price: 368.40, change: 5.60, high: 372.00, low: 364.00, volume: 4567800 },
  "PETKM": { price: 22.48, change: 0.32, high: 22.80, low: 22.10, volume: 35678900 },
  "HEKTS": { price: 128.90, change: -1.40, high: 131.00, low: 128.00, volume: 7654300 },
  "ENKAI": { price: 45.80, change: 0.75, high: 46.20, low: 45.00, volume: 11234500 },
  "VESTL": { price: 35.20, change: 0.48, high: 35.60, low: 34.80, volume: 9876500 },
}

// Sector mapping
export const SECTOR_DATA: Record<string, string[]> = {
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
  "Beyaz Eşya": ["VESTL"],
}

export const SYMBOL_TO_SECTOR: Record<string, string> = Object.entries(SECTOR_DATA).reduce(
  (acc, [sector, symbols]) => {
    symbols.forEach(s => { acc[s] = sector })
    return acc
  },
  {} as Record<string, string>
)

// Format helpers
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat('tr-TR').format(num)
}

export const formatPercent = (percent: number | null | undefined): string => {
  if (percent === null || percent === undefined) return '-'
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

export const formatLargeNumber = (num: number | null | undefined): string => {
  if (!num) return '-'
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)} T₺`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} Milyar ₺`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)} Milyon ₺`
  return formatNumber(num)
}

// Get mock quote
export function getMockQuote(symbol: string): StockData {
  const base = MOCK_STOCK_DATA[symbol] || { price: 100, change: 0, high: 102, low: 98, volume: 1000000 }
  const variation = (Math.random() - 0.5) * 0.04
  const price = Math.round(base.price * (1 + variation) * 100) / 100
  const change = Math.round(base.change * (0.8 + Math.random() * 0.4) * 100) / 100
  const changePercent = Math.round((change / (price - change)) * 10000) / 100
  
  const stockInfo = POPULAR_STOCKS.find(s => s.symbol === symbol)
  
  return {
    symbol,
    name: stockInfo?.name || symbol,
    price,
    change,
    change_percent: changePercent,
    high: Math.round(base.high * (1 + variation) * 100) / 100,
    low: Math.round(base.low * (1 + variation) * 100) / 100,
    open_price: Math.round((price - change) * 100) / 100,
    close_price: Math.round((price - change) * 100) / 100,
    volume: Math.round(base.volume * (0.9 + Math.random() * 0.2)),
    fifty_two_week_high: Math.round(base.price * 1.35 * 100) / 100,
    fifty_two_week_low: Math.round(base.price * 0.65 * 100) / 100,
  }
}
