import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, formatPrice, formatPercent, formatNumber } from '@/lib/api';
import { StockCard, LoadingSkeleton } from '@/components/stocks/StockCard';

export function Dashboard() {
  const [marketSummary, setMarketSummary] = useState(null);
  const [popularStocks, setPopularStocks] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [marketRes, popularRes, gainersRes, losersRes, watchlistRes] = await Promise.all([
        api.getMarketSummary(),
        api.getPopularStocks(),
        api.getTopGainers(5),
        api.getTopLosers(5),
        api.getWatchlist().catch(() => ({ data: [] }))
      ]);

      setMarketSummary(marketRes.data);
      setPopularStocks(popularRes.data);
      setGainers(gainersRes.data);
      setLosers(losersRes.data);
      setWatchlist(watchlistRes.data.map(w => w.symbol));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <LoadingSkeleton rows={10} />
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 lg:p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Piyasa Özeti</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="refresh-btn"
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Yenile</span>
        </button>
      </motion.div>

      {/* Market Summary Cards */}
      {marketSummary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* BIST 100 */}
          <div className="bg-card border border-border p-6 card-hover" data-testid="xu100-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
            </div>
            <div className="flex items-end justify-between">
              <p className="font-mono text-2xl font-bold">
                {formatNumber(marketSummary.xu100.value)}
              </p>
              <div className={`flex items-center gap-1 ${
                marketSummary.xu100.change_percent >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                {marketSummary.xu100.change_percent >= 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="font-mono text-lg font-bold">
                  {formatPercent(marketSummary.xu100.change_percent)}
                </span>
              </div>
            </div>
          </div>

          {/* BIST 30 */}
          <div className="bg-card border border-border p-6 card-hover" data-testid="xu030-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
            </div>
            <div className="flex items-end justify-between">
              <p className="font-mono text-2xl font-bold">
                {formatNumber(marketSummary.xu030.value)}
              </p>
              <div className={`flex items-center gap-1 ${
                marketSummary.xu030.change_percent >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                {marketSummary.xu030.change_percent >= 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="font-mono text-lg font-bold">
                  {formatPercent(marketSummary.xu030.change_percent)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border p-6 card-hover" data-testid="stats-card">
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
        </motion.div>
      )}

      {/* Gainers & Losers Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-card border border-border p-6" data-testid="gainers-section">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold">En Çok Yükselenler</h2>
            </div>
            <Link 
              to="/stocks?sort=gainers" 
              className="text-sm text-primary hover:underline"
              data-testid="see-all-gainers"
            >
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-3">
            {gainers.map((stock, index) => (
              <Link
                key={stock.symbol}
                to={`/stocks/${stock.symbol}`}
                data-testid={`gainer-${stock.symbol}`}
                className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
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

        {/* Top Losers */}
        <div className="bg-card border border-border p-6" data-testid="losers-section">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-destructive/20 rounded flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="font-heading text-xl font-bold">En Çok Düşenler</h2>
            </div>
            <Link 
              to="/stocks?sort=losers" 
              className="text-sm text-primary hover:underline"
              data-testid="see-all-losers"
            >
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-3">
            {losers.map((stock, index) => (
              <Link
                key={stock.symbol}
                to={`/stocks/${stock.symbol}`}
                data-testid={`loser-${stock.symbol}`}
                className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
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
      </motion.div>

      {/* Popular Stocks Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Popüler Hisseler</h2>
          <Link 
            to="/stocks" 
            className="text-sm text-primary hover:underline"
            data-testid="see-all-stocks"
          >
            Tüm Hisseleri Gör
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {popularStocks.slice(0, 8).map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onWatchlistToggle={handleWatchlistToggle}
              isInWatchlist={watchlist.includes(stock.symbol)}
            />
          ))}
        </div>
      </motion.div>

      {/* Legal Disclaimer */}
      <motion.div 
        variants={itemVariants}
        className="bg-muted/50 border border-border p-6 mt-8"
        data-testid="disclaimer"
      >
        <h3 className="font-heading text-lg font-bold mb-2">Yasal Uyarı</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bu platform sadece eğitim amaçlıdır ve yatırım tavsiyesi niteliği taşımamaktadır. 
          Gösterilen veriler gecikmeli olarak sağlanmakta olup, yatırım kararlarınızı profesyonel 
          danışmanlarla görüşerek vermeniz önerilir. Platform, herhangi bir yatırım kararından 
          doğabilecek kayıplardan sorumlu tutulamaz.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
