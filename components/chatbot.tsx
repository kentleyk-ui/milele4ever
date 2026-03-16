'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

export function Chatbot() {
  const { t, language } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
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
      {/* Chat Button */}
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

      {/* Chat Window */}
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
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 id="chatbot-title" className="font-semibold text-sm">
                Malaïka
              </h3>
              <p className="text-xs text-muted-foreground">
                {isLoading 
                  ? t('chatbot.typing', 'En train d\'ecrire...')
                  : t('chatbot.online', 'En ligne')
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              aria-label={t('chatbot.close', 'Fermer')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
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
                
                {/* Suggested Questions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-2">
                    {t('chatbot.suggestions', 'Questions frequentes:')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          sendMessage({ text: question })
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
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10"
                  )}>
                    {message.role === 'user' 
                      ? <User className="w-4 h-4" />
                      : <Bot className="w-4 h-4 text-primary" />
                    }
                  </div>
                  <div className={cn(
                    "rounded-2xl p-3 max-w-[85%]",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}>
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return (
                          <p key={index} className="text-sm whitespace-pre-wrap">
                            {part.text}
                          </p>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
                aria-label={t('chatbot.inputLabel', 'Message')}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full w-10 h-10 shrink-0"
                disabled={!input.trim() || isLoading}
                aria-label={t('chatbot.send', 'Envoyer')}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
