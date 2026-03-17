import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, formatPrice } from '@/lib/api';

function StockChart({ symbol, period = '1mo' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.getStockHistory(symbol, period);
        if (response.data?.data) {
          setData(response.data.data.map(d => ({
            date: d.date,
            price: d.close,
            high: d.high,
            low: d.low,
            volume: d.volume
          })));
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [symbol, period]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-mono text-lg font-bold text-primary">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-card">
        <div className="text-muted-foreground">Grafik yükleniyor...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-card">
        <div className="text-muted-foreground">Grafik verisi bulunamadı</div>
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.price)) * 0.98;
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.02;
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;

  return (
    <div className="w-full h-[400px] bg-card p-4" data-testid="stock-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isPositive ? "#22C55E" : "#EF4444"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={isPositive ? "#22C55E" : "#EF4444"} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(39, 39, 42, 0.5)" 
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={{ stroke: '#27272A' }}
            axisLine={{ stroke: '#27272A' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={{ stroke: '#27272A' }}
            axisLine={{ stroke: '#27272A' }}
            tickFormatter={(value) => `₺${value.toFixed(0)}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "#22C55E" : "#EF4444"}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChart;
