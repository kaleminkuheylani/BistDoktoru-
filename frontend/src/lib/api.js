import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${API_BASE}/api`;

export const api = {
  // Market endpoints
  getMarketSummary: () => axios.get(`${API}/market/summary`),
  
  // Stock endpoints
  getPopularStocks: () => axios.get(`${API}/stocks/popular`),
  getTopGainers: (limit = 5) => axios.get(`${API}/stocks/gainers?limit=${limit}`),
  getTopLosers: (limit = 5) => axios.get(`${API}/stocks/losers?limit=${limit}`),
  getAllStocks: () => axios.get(`${API}/stocks/all`),
  getStockDetail: (symbol) => axios.get(`${API}/stocks/${symbol}`),
  getStockHistory: (symbol, period = '1mo') => axios.get(`${API}/stocks/${symbol}/history?period=${period}`),
  searchStocks: (query) => axios.get(`${API}/stocks/search/${query}`),
  
  // Watchlist endpoints
  getWatchlist: () => axios.get(`${API}/watchlist`),
  getWatchlistWithData: () => axios.get(`${API}/watchlist/data`),
  addToWatchlist: (symbol, name) => axios.post(`${API}/watchlist`, { symbol, name }),
  removeFromWatchlist: (symbol) => axios.delete(`${API}/watchlist/${symbol}`),
  
  // Chat endpoint
  sendChatMessage: (message, sessionId) => axios.post(`${API}/chat`, { message, session_id: sessionId }),
};

// Format price in Turkish locale
export const formatPrice = (price) => {
  if (!price && price !== 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Format number with Turkish locale
export const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('tr-TR').format(num);
};

// Format percentage
export const formatPercent = (percent) => {
  if (!percent && percent !== 0) return '-';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

// Format large numbers (market cap, volume)
export const formatLargeNumber = (num) => {
  if (!num) return '-';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)} T₺`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} Milyar ₺`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)} Milyon ₺`;
  return formatNumber(num);
};

export default api;
