import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

// Layout
import Layout from "@/components/layout/Layout";

// Pages
import Dashboard from "@/pages/Dashboard";
import StocksPage from "@/pages/StocksPage";
import StockDetailPage from "@/pages/StockDetailPage";
import WatchlistPage from "@/pages/WatchlistPage";

// Components
import Chatbot from "@/components/chat/Chatbot";

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/stocks/:symbol" element={<StockDetailPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
          </Routes>
        </Layout>
        <Chatbot />
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 7%)',
              border: '1px solid hsl(240 4% 16%)',
              color: 'hsl(0 0% 98%)',
            },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
