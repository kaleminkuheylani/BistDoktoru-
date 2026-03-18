import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { POPULAR_STOCKS, getMockQuote, SYMBOL_TO_SECTOR, SECTOR_DATA } from '@/lib/stocks'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Store chat histories (in production, use Redis or database)
const chatHistories: Record<string, { role: 'user' | 'assistant'; content: string }[]> = {}

async function getStockContext(message: string): Promise<string> {
  const lowerMsg = message.toLowerCase()
  let context = ''
  
  // Find mentioned stocks
  const mentionedSymbols = POPULAR_STOCKS.filter(
    s => lowerMsg.includes(s.symbol.toLowerCase()) || lowerMsg.includes(s.name.toLowerCase())
  )
  
  if (mentionedSymbols.length > 0) {
    const symbol = mentionedSymbols[0].symbol
    const quote = getMockQuote(symbol)
    const sector = SYMBOL_TO_SECTOR[symbol] || 'Diğer'
    
    // Check for analysis request
    if (['analiz', 'değerlendir', 'incele', 'derinlik'].some(w => lowerMsg.includes(w))) {
      // Calculate mock technical indicators
      const rsi = Math.round(30 + Math.random() * 40)
      const sma20 = Math.round(quote.price * (0.95 + Math.random() * 0.1) * 100) / 100
      const volatility = Math.round((5 + Math.random() * 10) * 100) / 100
      
      // Sector average P/E
      const sectorPe = 8 + Math.random() * 15
      const stockPe = 5 + Math.random() * 20
      const peVsSector = stockPe < sectorPe ? 'Ucuz' : 'Pahalı'
      
      context = `
[DERİNLİK ANALİZİ] ${symbol} - ${quote.name}
Sektör: ${sector}
Fiyat: ₺${quote.price} (${quote.change_percent >= 0 ? '+' : ''}${quote.change_percent}%)

TEMEL ANALİZ:
- F/K Oranı: ${stockPe.toFixed(2)}
- Sektör Ort. F/K: ${sectorPe.toFixed(2)}
- Değerleme: ${peVsSector}

TEKNİK ANALİZ:
- RSI: ${rsi} (${rsi > 70 ? 'Aşırı Alım' : rsi < 30 ? 'Aşırı Satım' : 'Nötr'})
- 20 Günlük SMA: ₺${sma20}
- Volatilite: %${volatility}
- Trend: ${quote.price > sma20 ? 'Yükseliş' : 'Düşüş'}

FİYAT ANALİZİ:
- 52H Yüksek: ₺${quote.fifty_two_week_high}
- 52H Düşük: ₺${quote.fifty_two_week_low}
`
    } else if (['fiyat', 'kaç', 'ne kadar', 'değer'].some(w => lowerMsg.includes(w))) {
      context = `
[GÜNCEL VERİ] ${symbol} Hisse Bilgisi:
- Fiyat: ₺${quote.price}
- Değişim: ${quote.change_percent >= 0 ? '+' : ''}${quote.change_percent}%
- Günlük Yüksek: ₺${quote.high}
- Günlük Düşük: ₺${quote.low}
- Hacim: ${quote.volume?.toLocaleString('tr-TR')}
`
    }
  }
  
  // Check for sector analysis
  if (['sektör', 'sektor', 'karşılaştır', 'f/k', 'fk'].some(w => lowerMsg.includes(w))) {
    context += '\n[SEKTÖR F/K ANALİZİ]\n'
    for (const [sector, symbols] of Object.entries(SECTOR_DATA)) {
      const avgPe = Math.round((5 + Math.random() * 20) * 100) / 100
      context += `- ${sector}: Ort. F/K ${avgPe}, ${symbols.length} hisse\n`
    }
  }
  
  return context
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }
    
    const session = sessionId || crypto.randomUUID()
    
    // Initialize chat history if needed
    if (!chatHistories[session]) {
      chatHistories[session] = []
    }
    
    // Get stock context if relevant
    const stockContext = await getStockContext(message)
    
    const systemMessage = `Sen "Bist Doktoru", Türk borsası (BIST) konusunda uzman bir yapay zeka asistanısın.

KULLANDIĞIN ARAÇLAR:
1. Fiyat Sorgulama: Anlık hisse fiyatı, değişim, hacim bilgisi
2. Derinlik Analizi: F/K oranı, RSI, SMA, volatilite, sektör karşılaştırması
3. Geçmiş Veri: Tarihsel fiyat hareketleri
4. Sektör Analizi: Sektörel F/K karşılaştırması

TAKİP EDİLEN HİSSELER: ${POPULAR_STOCKS.map(s => s.symbol).join(', ')}

Görevlerin:
- Türk borsası ve hisse senetleri hakkında sorulara yanıt vermek
- Temel analiz kavramlarını açıklamak (F/K oranı, piyasa değeri, temettü verimi vb.)
- Teknik analiz terimlerini basitçe anlatmak (RSI, SMA, destek/direnç)
- Sektörel karşılaştırmalar yapmak

ÖNEMLİ UYARILAR:
- Bu platform eğitim amaçlıdır, yatırım tavsiyesi değildir
- Kesinlikle "al" veya "sat" tavsiyesi verme
- Her zaman "yatırım kararlarınızı profesyonel danışmanlarla görüşerek verin" uyarısı ekle
- Türkçe yanıt ver
- Kısa ve öz ol

${stockContext}`

    // Add user message to history
    chatHistories[session].push({ role: 'user', content: message })
    
    // Keep only last 10 messages
    if (chatHistories[session].length > 10) {
      chatHistories[session] = chatHistories[session].slice(-10)
    }
    
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...chatHistories[session]
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })
    
    const assistantMessage = completion.choices[0]?.message?.content || 'Üzgünüm, yanıt oluşturulamadı.'
    
    // Add assistant message to history
    chatHistories[session].push({ role: 'assistant', content: assistantMessage })
    
    return NextResponse.json({
      response: assistantMessage,
      sessionId: session
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Chatbot yanıt veremedi', response: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.', sessionId: '' },
      { status: 500 }
    )
  }
}
