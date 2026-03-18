'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Eye, Plus, Search, TrendingUp, LayoutDashboard, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react'
import { StockData, formatPrice, formatPercent, formatNumber, getMockQuote, POPULAR_STOCKS } from '@/lib/stocks'
import Chatbot from '@/components/chat/Chatbot'

interface WatchlistItem {
  id: string
  symbol: string
  name: string
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [watchlistStocks, setWatchlistStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockData[]>([])

  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await fetch('/api/watchlist?userId=anonymous')
      const data = await response.json()
      setWatchlist(data)

      // Get stock data for watchlist items
      const stocks = data.map((item: WatchlistItem) => getMockQuote(item.symbol))
      setWatchlistStocks(stocks)
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWatchlist()
    const interval = setInterval(fetchWatchlist, 60000)
    return () => clearInterval(interval)
  }, [fetchWatchlist])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const matching = POPULAR_STOCKS.filter(
      s => !watchlist.some(w => w.symbol === s.symbol) &&
        (s.symbol.toLowerCase().includes(lowerQuery) || s.name.toLowerCase().includes(lowerQuery))
    )
    setSearchResults(matching.slice(0, 5).map(s => getMockQuote(s.symbol)))
  }

  const handleAddToWatchlist = async (stock: StockData) => {
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: stock.symbol, name: stock.name, userId: 'anonymous' })
      })
      setWatchlist(prev => [...prev, { id: crypto.randomUUID(), symbol: stock.symbol, name: stock.name }])
      setWatchlistStocks(prev => [...prev, stock])
      setSearchResults(prev => prev.filter(s => s.symbol !== stock.symbol))
    } catch (error) {
      console.error('Add to watchlist error:', error)
    }
  }

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      await fetch(`/api/watchlist?symbol=${symbol}&userId=anonymous`, { method: 'DELETE' })
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol))
      setWatchlistStocks(prev => prev.filter(s => s.symbol !== symbol))
    } catch (error) {
      console.error('Remove from watchlist error:', error)
    }
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
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/stocks" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Tüm Hisseler</span>
          </Link>
          <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 border-l-2 border-primary">
            <Eye className="w-5 h-5" />
            <span className="font-medium">İzleme Listesi</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pb-24">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              İzleme Listesi
            </h1>
            <p className="text-muted-foreground mt-1">{watchlistStocks.length} hisse takip ediliyor</p>
          </div>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors glow-green rounded"
          >
            <Plus className="w-5 h-5" />
            Hisse Ekle
          </button>
        </div>

        {/* Search Panel */}
        {searchOpen && (
          <div className="bg-card border border-border p-6 mb-6 rounded animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">Hisse Ara</h2>
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}
                className="text-muted-foreground hover:text-foreground">Kapat</button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Hisse sembolü veya ismi..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-border placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded"
                autoFocus
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors rounded">
                    <Link href={`/stocks/${stock.symbol}`} className="flex-1">
                      <p className="font-heading font-bold">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </Link>
                    <button
                      onClick={() => handleAddToWatchlist(stock)}
                      className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors rounded"
                    >
                      Ekle
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">Sonuç bulunamadı.</p>
            )}
          </div>
        )}

        {/* Watchlist */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        ) : watchlistStocks.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded">
            <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">İzleme Listeniz Boş</h2>
            <p className="text-muted-foreground mb-6">Takip etmek istediğiniz hisseleri ekleyerek başlayın.</p>
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors rounded"
            >
              <Plus className="w-5 h-5" />
              İlk Hisseyi Ekle
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border overflow-x-auto rounded">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Hisse</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Fiyat</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Değişim</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Hacim</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {watchlistStocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-white/5 transition-colors border-b border-white/5">
                    <td className="py-4 px-4">
                      <Link href={`/stocks/${stock.symbol}`} className="hover:text-primary transition-colors">
                        <span className="font-heading font-bold">{stock.symbol}</span>
                        <span className="block text-sm text-muted-foreground">{stock.name}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-right">{formatPrice(stock.price)}</td>
                    <td className={`py-4 px-4 font-mono text-sm text-right ${
                      stock.change_percent >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {stock.change_percent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {formatPercent(stock.change_percent)}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-right text-muted-foreground">
                      {formatNumber(stock.volume)}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/50 border border-border p-6 mt-6 rounded">
          <h3 className="font-heading text-lg font-bold mb-2">İpuçları</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Hisse kartlarındaki göz ikonuna tıklayarak da izleme listesine ekleme yapabilirsiniz.</li>
            <li>• Veriler her dakika otomatik olarak güncellenir.</li>
            <li>• İzleme listeniz Supabase'de saklanır.</li>
          </ul>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 lg:hidden">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/stocks" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Hisseler</span>
          </Link>
          <Link href="/watchlist" className="flex flex-col items-center gap-1 p-2 text-primary">
            <Eye className="w-5 h-5" />
            <span className="text-xs">İzleme</span>
          </Link>
        </div>
      </nav>

      <Chatbot />
    </div>
  )
}
