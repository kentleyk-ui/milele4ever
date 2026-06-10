'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

// Custom Angel Icon for Malaïka
function AngelIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="5" rx="3" ry="1" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M12 11.5v4" />
      <path d="M8 13c-2-1-3 0-3 2s2 2 4 1" />
      <path d="M16 13c2-1 3 0 3 2s-2 2-4 1" />
      <path d="M9 19l3-3.5 3 3.5" />
    </svg>
  )
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function Chatbot() {
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
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/malaika', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            id: m.id,
            role: m.role,
            content: m.text,
            parts: [{ type: 'text', text: m.text }],
          })),
          language,
        }),
      })

      if (!res.ok) throw new Error('Failed')

      const data = await res.json()
      const text = data.text || data.response || "Je suis désolé, une erreur est survenue."
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: language === 'fr'
          ? "Je suis désolé, une erreur est survenue. Veuillez réessayer plus tard."
          : "I'm sorry, an error occurred. Please try again later."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = language === 'fr' ? [
    "Quels services proposez-vous?",
    "Comment fonctionne le simulateur?",
    "Que signifie Milele?",
  ] : [
    "What services do you offer?",
    "How does the simulator work?",
    "What does Milele mean?",
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-all duration-200",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isOpen && "bg-muted text-muted-foreground"
        )}
        aria-label={isOpen ? t('chatbot.close', 'Fermer le chat') : t('chatbot.open', 'Ouvrir le chat')}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-36 right-4 z-50 w-[calc(100vw-2rem)] max-w-[380px]",
            "bg-background border border-border rounded-2xl shadow-xl",
            "flex flex-col overflow-hidden",
            "animate-in slide-in-from-bottom-5 fade-in duration-300"
          )}
          style={{ height: 'min(500px, calc(100vh - 180px))' }}
          role="dialog"
          aria-labelledby="chatbot-title"
        >
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <AngelIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 id="chatbot-title" className="font-semibold text-sm">Malaïka</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? t('chatbot.typing', 'En train d\'ecrire...') : t('chatbot.online', 'En ligne')}
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
                    <AngelIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                    <p className="text-sm">
                      {language === 'fr' 
                        ? "Bonjour! Je suis Malaïka, votre assistante Milele. Mon nom signifie \"ange\" en Swahili. Je suis la pour vous accompagner et repondre a vos questions sur nos services. Comment puis-je vous aider?"
                        : "Hello! I'm Malaïka, your Milele assistant. My name means \"angel\" in Swahili. I'm here to support you and answer your questions about our services. How can I help you?"
                      }
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-2">{t('chatbot.suggestions', 'Questions frequentes:')}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const msg: Message = { id: Date.now().toString(), role: 'user', text: question }
                          setMessages(prev => [...prev, msg])
                        }}
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
                <div key={message.id} className={cn("flex gap-3", message.role === 'user' && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  )}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <AngelIcon className="w-4 h-4 text-primary" />}
                  </div>
                  <div className={cn(
                    "rounded-2xl p-3 max-w-[85%]",
                    message.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <AngelIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
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
                  "flex-1 px-4 py-2.5 text-sm rounded-full",
                  "bg-muted border-0 outline-none",
                  "placeholder:text-muted-foreground",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
