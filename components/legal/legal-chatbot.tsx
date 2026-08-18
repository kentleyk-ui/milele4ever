'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, User, Loader2, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

// Lit le flux SSE renvoyé par streamText().toUIMessageStreamResponse() et
// accumule le texte au fur et à mesure (events de type "text-delta").
async function streamAssistantReply(
  response: Response,
  onDelta: (delta: string) => void
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const event = JSON.parse(payload)
        if (event.type === 'text-delta' && typeof event.delta === 'string') {
          onDelta(event.delta)
        }
      } catch {
        // ligne SSE incomplète ou non-JSON, on l'ignore
      }
    }
  }
}

export function LegalChatbot() {
  const { t, language } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.text }],
          })),
        }),
      })

      if (!res.ok) throw new Error('Failed')

      await streamAssistantReply(res, (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m))
        )
      })
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text:
                  language === 'fr'
                    ? 'Je suis désolé, une erreur est survenue. Veuillez réessayer plus tard.'
                    : "I'm sorry, an error occurred. Please try again later.",
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions =
    language === 'fr'
      ? ['Quel document choisir pour protéger une idée ?', 'Comment fonctionne la révision de contrat ?', "Qu'est-ce qu'une due diligence ?"]
      : ['Which document protects an idea?', 'How does contract review work?', 'What is due diligence?']

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isOpen && 'bg-muted text-muted-foreground'
        )}
        aria-label={isOpen ? t('chatbot.close', 'Fermer le chat') : t('chatbot.open', 'Ouvrir le chat')}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className={cn(
            'fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-[380px]',
            'bg-background border border-border rounded-2xl shadow-xl',
            'flex flex-col overflow-hidden',
            'animate-in slide-in-from-bottom-5 fade-in duration-300'
          )}
          style={{ height: 'min(500px, calc(100vh - 180px))' }}
          role="dialog"
          aria-labelledby="legal-chatbot-title"
        >
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 id="legal-chatbot-title" className="font-semibold text-sm">
                Aurea Clavis
              </h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? t('chatbot.typing', "En train d'écrire...") : t('chatbot.online', 'En ligne')}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                    <p className="text-sm">
                      {language === 'fr'
                        ? "Bonjour ! Je peux vous aider à vous orienter parmi les documents d'Aurea Clavis (NDA, contrats de service, due diligence...). Cette conversation reste une information générale, pas un avis juridique. Comment puis-je vous aider ?"
                        : "Hello! I can help you find your way around Aurea Clavis' documents (NDA, service agreements, due diligence...). This conversation is general information, not legal advice. How can I help?"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-2">{t('chatbot.suggestions', 'Questions fréquentes:')}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(question)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                    )}
                  >
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Scale className="w-4 h-4 text-primary" />}
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl p-3 max-w-[85%]',
                      message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'
                    )}
                  >
                    {message.text ? (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatbot.placeholder', 'Posez votre question...')}
                className={cn(
                  'flex-1 px-4 py-2.5 text-sm rounded-full',
                  'bg-muted border-0 outline-none',
                  'placeholder:text-muted-foreground',
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                )}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="rounded-full w-10 h-10 shrink-0" disabled={!input.trim() || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
