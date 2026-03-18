# Bist Doktoru - Türk Borsası Takip Platformu

Vercel-uyumlu Next.js uygulaması. BIST hisse senetleri takip, analiz ve eğitim platformu.

## Özellikler

- **Dashboard**: BIST 100/30 endeksleri, en çok yükselenler/düşenler
- **Tüm Hisseler**: 20 popüler BIST hissesi, arama ve sıralama
- **Hisse Detay**: Grafikler, temel göstergeler, geçmiş veriler
- **İzleme Listesi**: Supabase ile kalıcı saklama
- **AI Chatbot**: OpenAI GPT-4o-mini ile Türkçe borsa asistanı
- **Gerçek Veri**: Twelve Data API entegrasyonu

## Teknolojiler

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **Database**: Supabase
- **Data**: Twelve Data API
- **Charts**: Recharts

## Kurulum

```bash
cd frontend
yarn install
yarn dev
```

## Environment Variables

Vercel'de aşağıdaki environment variables tanımlayın:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
TWELVE_DATA_API_KEY=your_twelve_data_key
```

## Supabase Tablo Yapısı

```sql
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) DEFAULT 'anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);
```

## Vercel Deployment

1. GitHub'a push edin
2. Vercel'de "New Project" seçin
3. Repository'yi seçin
4. Environment variables ekleyin
5. Deploy!

## Yasal Uyarı

Bu platform sadece eğitim amaçlıdır ve yatırım tavsiyesi niteliği taşımamaktadır.
