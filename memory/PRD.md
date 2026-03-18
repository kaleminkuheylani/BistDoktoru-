# Bist Doktoru - Türk Borsası Takip Platformu

## Problem Statement
Turkish stock market education platform "Bist Doktoru" - Vercel-ready Next.js application with AI chatbot, stock tracking, and analysis tools.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18, Tailwind CSS, Recharts
- **AI**: OpenAI GPT-4o-mini
- **Database**: Supabase
- **Stock Data**: Twelve Data API
- **Deployment**: Vercel-ready

## Core Features
- [x] Dashboard with BIST 100/30 index summary
- [x] Top gainers and losers display
- [x] Popular stocks section (20 BIST stocks)
- [x] All stocks page with search/filter/sort
- [x] Stock detail page with charts and fundamentals
- [x] Watchlist management (Supabase)
- [x] AI chatbot with stock analysis tools
- [x] Turkish language interface
- [x] Vercel deployment ready

## API Routes (Serverless)
- GET /api/market - Market summary
- GET /api/stocks - Stock list (popular/gainers/losers/all)
- GET /api/stocks/[symbol] - Stock detail
- GET /api/stocks/[symbol]/history - Historical data
- POST /api/chat - AI chatbot
- GET/POST/DELETE /api/watchlist - Watchlist CRUD

## Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
TWELVE_DATA_API_KEY
```

## Supabase Setup
```sql
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) DEFAULT 'anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Deployment Steps
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## Date: March 2026
