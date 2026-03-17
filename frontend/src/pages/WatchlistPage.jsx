import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { StockTable, LoadingSkeleton } from '@/components/stocks/StockCard';

export function WatchlistPage() {
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await api.getWatchlistWithData();
      setWatchlistStocks(response.data);
      setWatchlistSymbols(response.data.map(s => s.symbol));
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 60000);
    return () => clearInterval(interval);
  }, [fetchWatchlist]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.searchStocks(query);
      setSearchResults(response.data.filter(s => !watchlistSymbols.includes(s.symbol)));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToWatchlist = async (stock) => {
    try {
      await api.addToWatchlist(stock.symbol, stock.name);
      setWatchlistSymbols(prev => [...prev, stock.symbol]);
      setWatchlistStocks(prev => [...prev, stock]);
      setSearchResults(prev => prev.filter(s => s.symbol !== stock.symbol));
    } catch (error) {
      console.error('Add to watchlist error:', error);
    }
  };

  const handleRemoveFromWatchlist = async (stock) => {
    try {
      await api.removeFromWatchlist(stock.symbol);
      setWatchlistSymbols(prev => prev.filter(s => s !== stock.symbol));
      setWatchlistStocks(prev => prev.filter(s => s.symbol !== stock.symbol));
    } catch (error) {
      console.error('Remove from watchlist error:', error);
    }
  };

  return (
    <motion.div 
      className="p-4 lg:p-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Eye className="w-8 h-8 text-primary" />
            İzleme Listesi
          </h1>
          <p className="text-muted-foreground mt-1">
            {watchlistStocks.length} hisse takip ediliyor
          </p>
        </div>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          data-testid="add-stock-btn"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors glow-green"
        >
          <Plus className="w-5 h-5" />
          Hisse Ekle
        </button>
      </div>

      {/* Search Panel */}
      {searchOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border p-6"
          data-testid="search-panel"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold">Hisse Ara</h2>
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Kapat
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Hisse sembolü veya ismi..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              data-testid="watchlist-search-input"
              className="w-full pl-10 pr-4 py-3 bg-black/20 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              autoFocus
            />
          </div>

          {searching && (
            <div className="py-4 text-center text-muted-foreground">
              Aranıyor...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Link to={`/stocks/${stock.symbol}`} className="flex-1">
                    <p className="font-heading font-bold">{stock.symbol}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </Link>
                  <button
                    onClick={() => handleAddToWatchlist(stock)}
                    data-testid={`add-${stock.symbol}`}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">
              Sonuç bulunamadı.
            </p>
          )}
        </motion.div>
      )}

      {/* Watchlist Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : watchlistStocks.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border" data-testid="empty-watchlist">
          <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">İzleme Listeniz Boş</h2>
          <p className="text-muted-foreground mb-6">
            Takip etmek istediğiniz hisseleri ekleyerek başlayın.
          </p>
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            İlk Hisseyi Ekle
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border">
          <StockTable
            stocks={watchlistStocks}
            onWatchlistToggle={handleRemoveFromWatchlist}
            watchlistSymbols={watchlistSymbols}
            showRank={false}
          />
        </div>
      )}

      {/* Tips */}
      <div className="bg-muted/50 border border-border p-6">
        <h3 className="font-heading text-lg font-bold mb-2">İpuçları</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Hisse kartlarındaki göz ikonuna tıklayarak da izleme listesine ekleme yapabilirsiniz.</li>
          <li>• Veriler her dakika otomatik olarak güncellenir.</li>
          <li>• İzleme listeniz tarayıcınızda saklanır.</li>
        </ul>
      </div>
    </motion.div>
  );
}

export default WatchlistPage;
