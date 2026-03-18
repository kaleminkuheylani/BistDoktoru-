'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, AlertTriangle } from 'lucide-react'

interface Message {
  role: 'user' | 'bot'
  content: string
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: 'Merhaba! Ben Bist Doktoru, Türk borsası hakkında sorularınızı yanıtlamak için buradayım. Size nasıl yardımcı olabilirim?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId })
      })

      const data = await response.json()
      setSessionId(data.sessionId)
      setMessages(prev => [...prev, { role: 'bot', content: data.response }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-32 lg:bottom-8 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg glow-green flex items-center justify-center transition-transform hover:scale-110 z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-32 lg:bottom-8 right-6 w-[calc(100%-3rem)] max-w-96 h-[500px] bg-card border border-border shadow-2xl z-50 flex flex-col animate-fade-in rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-bold">Bist Doktoru</h3>
                <p className="text-xs text-muted-foreground">AI Borsa Asistanı</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-500/80">
              Bu bilgiler eğitim amaçlıdır, yatırım tavsiyesi değildir.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 text-sm rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary/10 ml-auto rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[80%] p-3 text-sm bg-muted rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Düşünüyorum...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Sorunuzu yazın..."
                className="flex-1 bg-black/20 border border-border px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold uppercase text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
