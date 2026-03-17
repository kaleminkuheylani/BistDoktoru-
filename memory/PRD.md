# Bist Doktoru - Türk Borsa Takip Platformu

## Problem Statement
Turkish stock market education platform "Bist Doktoru" with chatbot integration, stock tracking dashboard, watchlist management, and educational content about BIST (Borsa Istanbul).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Recharts
- **Backend**: FastAPI + MongoDB
- **AI**: GPT-4o-mini via Emergent LLM Key
- **Data**: Mock BIST stock data (Yahoo Finance API blocked)
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

## What's Been Implemented (Jan 2026)
### Backend
- FastAPI server with /api prefix routes
- Mock stock data (20 popular BIST stocks)
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

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High Priority)
- Real-time data when Yahoo Finance API accessible
- User authentication for persistent watchlist
- Mobile app version

### P2 (Medium Priority)
- Stock comparison feature
- Price alerts
- Portfolio tracking
- Educational articles section

## Next Tasks
1. Connect to real BIST data source when available
2. Add user authentication (Supabase integration)
3. Implement stock price alerts
4. Add more educational content
