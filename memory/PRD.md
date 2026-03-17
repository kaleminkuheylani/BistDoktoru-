# Bist Doktoru - Türk Borsa Takip Platformu

## Problem Statement
Turkish stock market education platform "Bist Doktoru" with chatbot integration, stock tracking dashboard, watchlist management, and educational content about BIST (Borsa Istanbul).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Recharts
- **Backend**: FastAPI + MongoDB
- **AI**: GPT-4o-mini via Emergent LLM Key
- **Data**: Twelve Data API (real BIST stock data) with mock fallback
- **Theme**: Dark mode with green accents

## User Personas
1. **Retail Investors** - Turkish individuals learning about stock market
2. **Stock Market Learners** - Beginners seeking educational content
3. **Active Traders** - Users tracking multiple stocks via watchlist

## Core Requirements
- [x] Dashboard with BIST 100/30 index summary
- [x] Top gainers and losers display
- [x] Popular stocks section
- [x] All stocks page with search/filter
- [x] Stock detail page with chart and fundamentals
- [x] Watchlist management (add/remove)
- [x] AI chatbot for stock market education
- [x] Legal disclaimer (educational purposes only)
- [x] Turkish language interface
- [x] Twelve Data API integration for real stock data

## What's Been Implemented (Jan 2026)
### Backend
- FastAPI server with /api prefix routes
- **Twelve Data API integration** for real BIST stock prices
- 5-minute cache to respect API rate limits (8 calls/minute on free tier)
- Mock data fallback when API unavailable
- Market summary endpoint (BIST 100/30)
- Stock endpoints: popular, gainers, losers, all, detail, history, search
- Watchlist CRUD with MongoDB
- Chat endpoint with GPT-4o-mini integration

### Frontend
- Dashboard page with market overview
- All Stocks page with search and sort
- Stock Detail page with Recharts graph
- Watchlist page with add/remove functionality
- Floating chatbot with AI responses
- Responsive dark theme with green accents

## API Keys Used
- EMERGENT_LLM_KEY: For GPT-4o-mini chatbot
- TWELVE_DATA_API_KEY: For real BIST stock data

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High Priority)
- User authentication for persistent watchlist
- Upgrade Twelve Data plan for more API calls
- Mobile app version

### P2 (Medium Priority)
- Stock comparison feature
- Price alerts
- Portfolio tracking
- Educational articles section

## Next Tasks
1. Add user authentication (Supabase integration)
2. Implement stock price alerts
3. Add more educational content
4. Consider upgrading Twelve Data API plan
