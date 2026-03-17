import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { StockTable, LoadingSkeleton } from '@/components/stocks/StockCard';

export function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'symbol', direction: 'asc' });

  const fetchData = useCallback(async () => {
    try {
      const [stocksRes, watchlistRes] = await Promise.all([
        api.getAllStocks(),
        api.getWatchlist().catch(() => ({ data: [] }))
      ]);
      setStocks(stocksRes.data);
      setFilteredStocks(stocksRes.data);
      setWatchlist(watchlistRes.data.map(w => w.symbol));
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let result = [...stocks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        stock => 
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredStocks(result);
  }, [stocks, searchQuery, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleWatchlistToggle = async (stock) => {
    try {
      if (watchlist.includes(stock.symbol)) {
        await api.removeFromWatchlist(stock.symbol);
        setWatchlist(prev => prev.filter(s => s !== stock.symbol));
      } else {
        await api.addToWatchlist(stock.symbol, stock.name);
        setWatchlist(prev => [...prev, stock.symbol]);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
    }
  };

  const SortButton = ({ sortKey, label }) => (
    <button
      onClick={() => handleSort(sortKey)}
      data-testid={`sort-${sortKey}`}
      className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold transition-colors ${
        sortConfig.key === sortKey ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      {sortConfig.key === sortKey && (
        sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <motion.div 
      className="p-4 lg:p-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Tüm Hisseler
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredStocks.length} hisse listeleniyor
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Hisse ara (sembol veya isim)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="stock-search-input"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-4 py-3 border-b border-border overflow-x-auto">
        <span className="text-sm text-muted-foreground flex-shrink-0">Sırala:</span>
        <SortButton sortKey="symbol" label="Sembol" />
        <SortButton sortKey="price" label="Fiyat" />
        <SortButton sortKey="change_percent" label="Değişim" />
        <SortButton sortKey="volume" label="Hacim" />
      </div>

      {/* Stock Table */}
      {loading ? (
        <LoadingSkeleton rows={15} />
      ) : filteredStocks.length === 0 ? (
        <div className="text-center py-12" data-testid="no-results">
          <p className="text-muted-foreground">Aramanızla eşleşen hisse bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-card border border-border">
          <StockTable
            stocks={filteredStocks}
            onWatchlistToggle={handleWatchlistToggle}
            watchlistSymbols={watchlist}
            showRank={false}
          />
        </div>
      )}
    </motion.div>
  );
}

export default StocksPage;
