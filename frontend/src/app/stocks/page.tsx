'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Eye, LayoutDashboard, ArrowUpRight, ArrowDownRight, SortAsc, SortDesc } from 'lucide-react'
import { StockData, formatPrice, formatPercent, formatNumber } from '@/lib/stocks'
import Chatbot from '@/components/chat/Chatbot'

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'symbol', direction: 'asc' })

  const fetchStocks = useCallback(async () => {
    try {
      const response = await fetch('/api/stocks?type=all')
      const data = await response.json()
      setStocks(data)
      setFilteredStocks(data)
    } catch (error) {
      console.error('Error fetching stocks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  useEffect(() => {
    let result = [...stocks]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        stock =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof StockData]
      let bVal: any = b[sortConfig.key as keyof StockData]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredStocks(result)
  }, [stocks, searchQuery, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortButton = ({ sortKey, label }: { sortKey: string; label: string }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold transition-colors ${
        sortConfig.key === sortKey ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      {sortConfig.key === sortKey && (
        sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
      )}
    </button>
  )

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
      <main className="lg:ml-64 p-4 lg:p-8 pb-24">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight">Tüm Hisseler</h1>
            <p className="text-muted-foreground mt-1">{filteredStocks.length} hisse listeleniyor</p>
          </div>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Hisse ara (sembol veya isim)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4 py-3 border-b border-border overflow-x-auto mb-4">
          <span className="text-sm text-muted-foreground flex-shrink-0">Sırala:</span>
          <SortButton sortKey="symbol" label="Sembol" />
          <SortButton sortKey="price" label="Fiyat" />
          <SortButton sortKey="change_percent" label="Değişim" />
          <SortButton sortKey="volume" label="Hacim" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Aramanızla eşleşen hisse bulunamadı.</div>
        ) : (
          <div className="bg-card border border-border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Hisse</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Fiyat</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Değişim</th>
                  <th className="text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold py-3 px-4">Hacim</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
