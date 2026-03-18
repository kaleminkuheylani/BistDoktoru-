'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Eye, EyeOff, Building2, BarChart3, Calendar, TrendingUp, LayoutDashboard } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StockDetail, HistoricalData, formatPrice, formatPercent, formatNumber, formatLargeNumber } from '@/lib/stocks'
import Chatbot from '@/components/chat/Chatbot'

export default function StockDetailPage() {
  const params = useParams()
  const symbol = params.symbol as string

  const [stock, setStock] = useState<StockDetail | null>(null)
  const [history, setHistory] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('1mo')
  const [isInWatchlist, setIsInWatchlist] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [stockRes, historyRes] = await Promise.all([
        fetch(`/api/stocks/${symbol}`),
        fetch(`/api/stocks/${symbol}/history?period=${selectedPeriod}`)
      ])

      const [stockData, historyData] = await Promise.all([
        stockRes.json(),
        historyRes.json()
      ])

      setStock(stockData)
      setHistory(historyData.data || [])
    } catch (error) {
      console.error('Error fetching stock detail:', error)
    } finally {
      setLoading(false)
    }
  }, [symbol, selectedPeriod])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleWatchlistToggle = async () => {
    if (!stock) return

    try {
      if (isInWatchlist) {
        await fetch(`/api/watchlist?symbol=${symbol}&userId=anonymous`, { method: 'DELETE' })
        setIsInWatchlist(false)
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, name: stock.name, userId: 'anonymous' })
        })
        setIsInWatchlist(true)
      }
    } catch (error) {
      console.error('Watchlist error:', error)
    }
  }

  const periods = [
    { value: '1d', label: '1G' },
    { value: '5d', label: '5G' },
    { value: '1mo', label: '1A' },
    { value: '3mo', label: '3A' },
    { value: '6mo', label: '6A' },
    { value: '1y', label: '1Y' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 shadow-lg rounded">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-mono text-lg font-bold text-primary">{formatPrice(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
  }

  if (!stock) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Hisse bulunamadı.</p>
        <Link href="/stocks" className="text-primary hover:underline">Tüm Hisselere Dön</Link>
      </div>
    )
  }

  const isPositive = stock.change_percent >= 0
  const chartData = history.map(h => ({ date: h.date, price: h.close }))
  const chartIsPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40 hidden lg:block">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight">BIST DOKTORU</h1>
              <p className="text-xs text-muted-foreground">Borsa Takip Platformu</p>
            </div>
          </Link>
        </div>
        <nav className="py-6">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/stocks" className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 border-l-2 border-primary">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Tüm Hisseler</span>
          </Link>
          <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <Eye className="w-5 h-5" />
            <span className="font-medium">İzleme Listesi</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pb-24 space-y-6">
        <Link href="/stocks" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Hisseler</span>
        </Link>

        {/* Stock Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="font-heading text-4xl lg:text-5xl font-bold">{stock.symbol}</h1>
              <button
                onClick={handleWatchlistToggle}
                className={`p-3 rounded transition-all ${
                  isInWatchlist ? 'bg-primary text-primary-foreground glow-green' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {isInWatchlist ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xl text-muted-foreground mt-2">{stock.name}</p>
            {stock.sector && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{stock.sector}</span>
                {stock.industry && <span>• {stock.industry}</span>}
              </div>
            )}
          </div>

          <div className="text-left lg:text-right">
            <p className="font-mono text-4xl lg:text-5xl font-bold">{formatPrice(stock.price)}</p>
            <div className={`flex items-center gap-2 mt-2 lg:justify-end ${isPositive ? 'text-primary' : 'text-destructive'}`}>
              {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              <span className="font-mono text-2xl font-bold">{formatPercent(stock.change_percent)}</span>
              <span className="font-mono text-lg">({isPositive ? '+' : ''}{formatPrice(stock.change)})</span>
            </div>
          </div>
        </div>

        {/* Price Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Günlük Yüksek</p>
            <p className="font-mono text-lg font-bold mt-1">{formatPrice(stock.high)}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Günlük Düşük</p>
            <p className="font-mono text-lg font-bold mt-1">{formatPrice(stock.low)}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">52H Yüksek</p>
            <p className="font-mono text-lg font-bold mt-1 text-primary">{formatPrice(stock.fifty_two_week_high)}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">52H Düşük</p>
            <p className="font-mono text-lg font-bold mt-1 text-destructive">{formatPrice(stock.fifty_two_week_low)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-heading text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Grafik
            </h2>
            <div className="flex items-center gap-1">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-3 py-1 text-sm font-medium transition-colors rounded ${
                    selectedPeriod === period.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full h-[400px] p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartIsPositive ? "#22C55E" : "#EF4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartIsPositive ? "#22C55E" : "#EF4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 39, 42, 0.5)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={{ stroke: '#27272A' }} axisLine={{ stroke: '#27272A' }}
                    tickFormatter={(value) => { const date = new Date(value); return `${date.getDate()}/${date.getMonth() + 1}` }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={{ stroke: '#27272A' }} axisLine={{ stroke: '#27272A' }}
                    tickFormatter={(value) => `₺${value.toFixed(0)}`} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="price" stroke={chartIsPositive ? "#22C55E" : "#EF4444"} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Grafik verisi yükleniyor...</div>
            )}
          </div>
        </div>

        {/* Fundamentals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-6 rounded">
            <h2 className="font-heading text-xl font-bold mb-6">Temel Göstergeler</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Piyasa Değeri</span>
                <span className="font-mono font-bold">{formatLargeNumber(stock.market_cap)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">F/K Oranı</span>
                <span className="font-mono font-bold">{stock.pe_ratio?.toFixed(2) || '-'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Hisse Başı Kar</span>
                <span className="font-mono font-bold">{stock.eps ? formatPrice(stock.eps) : '-'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Temettü Verimi</span>
                <span className="font-mono font-bold">{stock.dividend_yield ? `${(stock.dividend_yield * 100).toFixed(2)}%` : '-'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Beta</span>
                <span className="font-mono font-bold">{stock.beta?.toFixed(2) || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded">
            <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Son İşlemler
            </h2>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left py-2">Tarih</th>
                      <th className="text-right py-2">Kapanış</th>
                      <th className="text-right py-2">Hacim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(-7).reverse().map((day) => (
                      <tr key={day.date} className="border-t border-border">
                        <td className="py-3 font-mono text-sm">{day.date}</td>
                        <td className="py-3 font-mono text-sm text-right">{formatPrice(day.close)}</td>
                        <td className="py-3 font-mono text-sm text-right text-muted-foreground">{formatNumber(day.volume)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Geçmiş veri bulunamadı.</p>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/50 border border-border p-4 rounded">
          <p className="text-xs text-muted-foreground">
            Veriler gecikmeli olarak sağlanmaktadır. Yatırım kararlarınızı profesyonel
            danışmanlarla görüşerek veriniz. Bu bilgiler yatırım tavsiyesi değildir.
          </p>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 lg:hidden">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/stocks" className="flex flex-col items-center gap-1 p-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Hisseler</span>
          </Link>
          <Link href="/watchlist" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <Eye className="w-5 h-5" />
            <span className="text-xs">İzleme</span>
          </Link>
        </div>
      </nav>

      <Chatbot />
    </div>
  )
}
