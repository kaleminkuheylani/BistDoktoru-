'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, LayoutDashboard, Eye } from 'lucide-react'
import { StockData, MarketSummary, formatPrice, formatPercent, formatNumber } from '@/lib/stocks'
import Chatbot from '@/components/chat/Chatbot'

export default function Dashboard() {
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null)
  const [popularStocks, setPopularStocks] = useState<StockData[]>([])
  const [gainers, setGainers] = useState<StockData[]>([])
  const [losers, setLosers] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [marketRes, popularRes, gainersRes, losersRes] = await Promise.all([
        fetch('/api/market'),
        fetch('/api/stocks?type=popular'),
        fetch('/api/stocks?type=gainers&limit=5'),
        fetch('/api/stocks?type=losers&limit=5')
      ])

      const [market, popular, gainersData, losersData] = await Promise.all([
        marketRes.json(),
        popularRes.json(),
        gainersRes.json(),
        losersRes.json()
      ])

      setMarketSummary(market)
      setPopularStocks(popular)
      setGainers(gainersData)
      setLosers(losersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    )
  }

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
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 border-l-2 border-primary">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/stocks" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Tüm Hisseler</span>
          </Link>
          <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <Eye className="w-5 h-5" />
            <span className="font-medium">İzleme Listesi</span>
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bu platform eğitim amaçlıdır. Yatırım tavsiyesi değildir.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Piyasa Özeti</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 transition-colors rounded"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>

        {/* Market Summary */}
        {marketSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${
                  marketSummary.xu100.change_percent >= 0 ? 'bg-primary/20' : 'bg-destructive/20'
                }`}>
                  <Activity className={`w-5 h-5 ${
                    marketSummary.xu100.change_percent >= 0 ? 'text-primary' : 'text-destructive'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endeks</p>
                  <h3 className="font-heading text-lg font-bold">BIST 100</h3>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="font-mono text-2xl font-bold">{formatNumber(marketSummary.xu100.value)}</p>
                <div className={`flex items-center gap-1 ${
                  marketSummary.xu100.change_percent >= 0 ? 'text-primary' : 'text-destructive'
                }`}>
                  {marketSummary.xu100.change_percent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  <span className="font-mono text-lg font-bold">{formatPercent(marketSummary.xu100.change_percent)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${
                  marketSummary.xu030.change_percent >= 0 ? 'bg-primary/20' : 'bg-destructive/20'
                }`}>
                  <Activity className={`w-5 h-5 ${
                    marketSummary.xu030.change_percent >= 0 ? 'text-primary' : 'text-destructive'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endeks</p>
                  <h3 className="font-heading text-lg font-bold">BIST 30</h3>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="font-mono text-2xl font-bold">{formatNumber(marketSummary.xu030.value)}</p>
                <div className={`flex items-center gap-1 ${
                  marketSummary.xu030.change_percent >= 0 ? 'text-primary' : 'text-destructive'
                }`}>
                  {marketSummary.xu030.change_percent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  <span className="font-mono text-lg font-bold">{formatPercent(marketSummary.xu030.change_percent)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border p-6 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Takip Edilen</p>
                  <h3 className="font-heading text-lg font-bold">{popularStocks.length} Hisse</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Yükselenler</p>
                  <p className="font-mono text-lg font-bold text-primary">
                    {popularStocks.filter(s => s.change_percent > 0).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Düşenler</p>
                  <p className="font-mono text-lg font-bold text-destructive">
                    {popularStocks.filter(s => s.change_percent < 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gainers & Losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-bold">En Çok Yükselenler</h2>
              </div>
              <Link href="/stocks?sort=gainers" className="text-sm text-primary hover:underline">Tümünü Gör</Link>
            </div>
            <div className="space-y-3">
              {gainers.map((stock, index) => (
                <Link key={stock.symbol} href={`/stocks/${stock.symbol}`}
                  className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground w-6">{index + 1}</span>
                    <div>
                      <p className="font-heading font-bold">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatPrice(stock.price)}</p>
                    <p className="font-mono text-sm text-primary flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {formatPercent(stock.change_percent)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-destructive/20 rounded flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <h2 className="font-heading text-xl font-bold">En Çok Düşenler</h2>
              </div>
              <Link href="/stocks?sort=losers" className="text-sm text-primary hover:underline">Tümünü Gör</Link>
            </div>
            <div className="space-y-3">
              {losers.map((stock, index) => (
                <Link key={stock.symbol} href={`/stocks/${stock.symbol}`}
                  className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground w-6">{index + 1}</span>
                    <div>
                      <p className="font-heading font-bold">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatPrice(stock.price)}</p>
                    <p className="font-mono text-sm text-destructive flex items-center justify-end gap-1">
                      <ArrowDownRight className="w-3 h-3" />
                      {formatPercent(stock.change_percent)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Stocks */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Popüler Hisseler</h2>
            <Link href="/stocks" className="text-sm text-primary hover:underline">Tüm Hisseleri Gör</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularStocks.slice(0, 8).map((stock) => (
              <Link key={stock.symbol} href={`/stocks/${stock.symbol}`}
                className="bg-card border border-border p-4 card-hover block">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold">{stock.symbol}</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-xl font-bold">{formatPrice(stock.price)}</p>
                    <div className={`flex items-center gap-1 mt-1 ${
                      stock.change_percent >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {stock.change_percent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="font-mono text-sm font-medium">{formatPercent(stock.change_percent)}</span>
                    </div>
                  </div>
                  {stock.volume && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Hacim</p>
                      <p className="font-mono text-sm text-muted-foreground">{formatNumber(stock.volume)}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/50 border border-border p-6">
          <h3 className="font-heading text-lg font-bold mb-2">Yasal Uyarı</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bu platform sadece eğitim amaçlıdır ve yatırım tavsiyesi niteliği taşımamaktadır.
            Gösterilen veriler gecikmeli olarak sağlanmakta olup, yatırım kararlarınızı profesyonel
            danışmanlarla görüşerek vermeniz önerilir.
          </p>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 lg:hidden">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-primary">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/stocks" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
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
