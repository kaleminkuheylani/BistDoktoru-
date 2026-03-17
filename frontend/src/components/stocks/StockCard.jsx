import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import { formatPrice, formatPercent, formatNumber } from '@/lib/api';

export function StockCard({ stock, onWatchlistToggle, isInWatchlist, showWatchlistButton = true }) {
  const isPositive = stock.change_percent >= 0;

  return (
    <Link
      to={`/stocks/${stock.symbol}`}
      data-testid={`stock-card-${stock.symbol}`}
      className="block bg-card border border-border p-4 card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">{stock.symbol}</h3>
          <p className="text-sm text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
        </div>
        {showWatchlistButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWatchlistToggle?.(stock);
            }}
            data-testid={`watchlist-toggle-${stock.symbol}`}
            className={`p-2 rounded transition-colors ${
              isInWatchlist 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {isInWatchlist ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xl font-bold text-foreground">
            {formatPrice(stock.price)}
          </p>
          <div className={`flex items-center gap-1 mt-1 ${
            isPositive ? 'text-primary' : 'text-destructive'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span className="font-mono text-sm font-medium">
              {formatPercent(stock.change_percent)}
            </span>
          </div>
        </div>
        {stock.volume > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Hacim</p>
            <p className="font-mono text-sm text-muted-foreground">
              {formatNumber(stock.volume)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

export function StockRow({ stock, rank, onWatchlistToggle, isInWatchlist }) {
  const isPositive = stock.change_percent >= 0;

  return (
    <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
      {rank && (
        <td className="py-4 px-4 font-mono text-sm text-muted-foreground">
          {rank}
        </td>
      )}
      <td className="py-4 px-4">
        <Link 
          to={`/stocks/${stock.symbol}`}
          data-testid={`stock-row-${stock.symbol}`}
          className="hover:text-primary transition-colors"
        >
          <span className="font-heading font-bold">{stock.symbol}</span>
          <span className="block text-sm text-muted-foreground">{stock.name}</span>
        </Link>
      </td>
      <td className="py-4 px-4 font-mono text-sm text-right">
        {formatPrice(stock.price)}
      </td>
      <td className={`py-4 px-4 font-mono text-sm text-right ${
        isPositive ? 'text-primary' : 'text-destructive'
      }`}>
        <div className="flex items-center justify-end gap-1">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {formatPercent(stock.change_percent)}
        </div>
      </td>
      <td className="py-4 px-4 font-mono text-sm text-right text-muted-foreground">
        {formatNumber(stock.volume)}
      </td>
      <td className="py-4 px-4">
        <button
          onClick={() => onWatchlistToggle?.(stock)}
          data-testid={`watchlist-row-toggle-${stock.symbol}`}
          className={`p-2 rounded transition-colors ${
            isInWatchlist 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          {isInWatchlist ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}

export function StockTable({ stocks, onWatchlistToggle, watchlistSymbols = [], showRank = false }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr className="border-b border-border">
            {showRank && <th className="text-left">#</th>}
            <th className="text-left">Hisse</th>
            <th className="text-right">Fiyat</th>
            <th className="text-right">Değişim</th>
            <th className="text-right">Hacim</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <StockRow
              key={stock.symbol}
              stock={stock}
              rank={showRank ? index + 1 : null}
              onWatchlistToggle={onWatchlistToggle}
              isInWatchlist={watchlistSymbols.includes(stock.symbol)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-4 w-32 flex-1" />
          <div className="skeleton h-6 w-24" />
          <div className="skeleton h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export default StockCard;
