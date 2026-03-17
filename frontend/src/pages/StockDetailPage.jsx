import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Eye, EyeOff, Building2, BarChart3, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, formatPrice, formatPercent, formatNumber, formatLargeNumber } from '@/lib/api';
import StockChart from '@/components/stocks/StockChart';
import { LoadingSkeleton } from '@/components/stocks/StockCard';

export function StockDetailPage() {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');

  const fetchData = useCallback(async () => {
    try {
      const [stockRes, historyRes, watchlistRes] = await Promise.all([
        api.getStockDetail(symbol),
        api.getStockHistory(symbol, selectedPeriod),
        api.getWatchlist().catch(() => ({ data: [] }))
      ]);
      
      setStock(stockRes.data);
      setHistory(historyRes.data.data || []);
      setIsInWatchlist(watchlistRes.data.some(w => w.symbol === symbol.toUpperCase()));
    } catch (error) {
      console.error('Error fetching stock detail:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, selectedPeriod]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleWatchlistToggle = async () => {
    try {
      if (isInWatchlist) {
        await api.removeFromWatchlist(symbol);
        setIsInWatchlist(false);
      } else {
        await api.addToWatchlist(symbol, stock.name);
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
    }
  };

  const periods = [
    { value: '1d', label: '1G' },
    { value: '5d', label: '5G' },
    { value: '1mo', label: '1A' },
    { value: '3mo', label: '3A' },
    { value: '6mo', label: '6A' },
    { value: '1y', label: '1Y' },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <LoadingSkeleton rows={10} />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="p-4 lg:p-8 text-center">
        <p className="text-muted-foreground">Hisse bulunamadı.</p>
        <Link to="/stocks" className="text-primary hover:underline mt-4 inline-block">
          Tüm Hisselere Dön
        </Link>
      </div>
    );
  }

  const isPositive = stock.change_percent >= 0;

  return (
    <motion.div 
      className="p-4 lg:p-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Back Navigation */}
      <Link 
        to="/stocks" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="back-link"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tüm Hisseler</span>
      </Link>

      {/* Stock Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground" data-testid="stock-symbol">
              {stock.symbol}
            </h1>
            <button
              onClick={handleWatchlistToggle}
              data-testid="watchlist-toggle"
              className={`p-3 rounded transition-all ${
                isInWatchlist 
                  ? 'bg-primary text-primary-foreground glow-green' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {isInWatchlist ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xl text-muted-foreground mt-2" data-testid="stock-name">{stock.name}</p>
          {stock.sector && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{stock.sector}</span>
              {stock.industry && <span>• {stock.industry}</span>}
            </div>
          )}
        </div>

        <div className="text-left lg:text-right">
          <p className="font-mono text-4xl lg:text-5xl font-bold" data-testid="stock-price">
            {formatPrice(stock.price)}
          </p>
          <div className={`flex items-center gap-2 mt-2 lg:justify-end ${
            isPositive ? 'text-primary' : 'text-destructive'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-6 h-6" />
            ) : (
              <ArrowDownRight className="w-6 h-6" />
            )}
            <span className="font-mono text-2xl font-bold" data-testid="stock-change">
              {formatPercent(stock.change_percent)}
            </span>
            <span className="font-mono text-lg">
              ({isPositive ? '+' : ''}{formatPrice(stock.change)})
            </span>
          </div>
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Günlük Yüksek</p>
          <p className="font-mono text-lg font-bold mt-1">{formatPrice(stock.high)}</p>
        </div>
        <div className="bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Günlük Düşük</p>
          <p className="font-mono text-lg font-bold mt-1">{formatPrice(stock.low)}</p>
        </div>
        <div className="bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">52H Yüksek</p>
          <p className="font-mono text-lg font-bold mt-1 text-primary">{formatPrice(stock.fifty_two_week_high)}</p>
        </div>
        <div className="bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">52H Düşük</p>
          <p className="font-mono text-lg font-bold mt-1 text-destructive">{formatPrice(stock.fifty_two_week_low)}</p>
        </div>
      </div>

      {/* Stock Chart */}
      <div className="bg-card border border-border">
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
                data-testid={`period-${period.value}`}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
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
        <StockChart symbol={stock.symbol} period={selectedPeriod} />
      </div>

      {/* Fundamentals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Stats */}
        <div className="bg-card border border-border p-6">
          <h2 className="font-heading text-xl font-bold mb-6">Temel Göstergeler</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Piyasa Değeri</span>
              <span className="font-mono font-bold">{formatLargeNumber(stock.market_cap)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">F/K Oranı</span>
              <span className="font-mono font-bold">{stock.pe_ratio ? stock.pe_ratio.toFixed(2) : '-'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Hisse Başı Kar</span>
              <span className="font-mono font-bold">{stock.eps ? formatPrice(stock.eps) : '-'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Temettü Verimi</span>
              <span className="font-mono font-bold">
                {stock.dividend_yield ? `${(stock.dividend_yield * 100).toFixed(2)}%` : '-'}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Beta</span>
              <span className="font-mono font-bold">{stock.beta ? stock.beta.toFixed(2) : '-'}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Ort. Hacim</span>
              <span className="font-mono font-bold">{formatNumber(stock.average_volume)}</span>
            </div>
          </div>
        </div>

        {/* Historical Data Summary */}
        <div className="bg-card border border-border p-6">
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
                      <td className="py-3 font-mono text-sm text-right text-muted-foreground">
                        {formatNumber(day.volume)}
                      </td>
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

      {/* Description */}
      {stock.description && (
        <div className="bg-card border border-border p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Şirket Hakkında</h2>
          <p className="text-muted-foreground leading-relaxed">{stock.description}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border p-4">
        <p className="text-xs text-muted-foreground">
          Veriler gecikmeli olarak sağlanmaktadır. Yatırım kararlarınızı profesyonel 
          danışmanlarla görüşerek veriniz. Bu bilgiler yatırım tavsiyesi değildir.
        </p>
      </div>
    </motion.div>
  );
}

export default StockDetailPage;
