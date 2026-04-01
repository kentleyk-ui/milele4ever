'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { ArrowLeft, Send, User, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const SUGGESTIONS = {
  fr: [
    'Comment créer un mémorial ?',
    'Quels services proposez-vous ?',
    'Comment partager un mémorial avec la famille ?',
    'Comment ajouter des photos et souvenirs ?',
    "Qu'est-ce que Milele Book ?",
    'Comment préserver un héritage ?',
  ],
  en: [
    'How do I create a memorial?',
    'What services do you offer?',
    'How do I share a memorial with family?',
    'How do I add photos and memories?',
    'What is Milele Book?',
    'How do I preserve a legacy?',
  ],
  es: [
    '¿Cómo creo un memorial?',
    '¿Qué servicios ofrecen?',
    '¿Cómo comparto un memorial con la familia?',
    '¿Cómo agrego fotos y recuerdos?',
    '¿Qué es Milele Book?',
    '¿Cómo preservar un legado?',
  ],
  sw: [
    'Ninawezaje kuunda ukumbusho?',
    'Mnatoa huduma gani?',
    'Ninawezaje kushiriki ukumbusho na familia?',
    'Ninawezaje kuongeza picha na kumbukumbu?',
    'Milele Book ni nini?',
    'Ninawezaje kuhifadhi urithi?',
  ],
}

export default function MalaikaPage() {
  const { t, language } = useI18n()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/malaika',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { messages, id, language },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestion = (suggestion: string) => {
    if (isLoading) return
    sendMessage({ text: suggestion })
  }

  const suggestions = SUGGESTIONS[language as keyof typeof SUGGESTIONS] ?? SUGGESTIONS.fr

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('common.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 border-2 border-primary/30 flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-2xl" role="img" aria-label="Malaika ange gardien">👼</span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-lg leading-tight">{t('malaika.title')}</h1>
              <p className="text-xs text-muted-foreground leading-tight">{t('malaika.subtitle')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Corps principal : suggestions gauche + chat droite */}
      <div className="flex-1 flex overflow-hidden container max-w-6xl px-4 py-6 gap-6">

        {/* Panneau de suggestions - cote gauche */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 gap-3">
          {/* Carte avatar ange gardien */}
          <Card className="p-5 flex flex-col items-center text-center gap-3 border-primary/20 bg-card milele-shadow">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/25 via-primary/15 to-accent/20 border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-5xl" role="img" aria-label="Malaika ange gardien">👼</span>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/15 scale-110 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <p className="font-serif font-bold text-base text-foreground">{t('malaika.title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('malaika.subtitle')}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 w-full">
              {t('malaika.greeting')}
            </p>
          </Card>

          {/* Suggestions */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Suggestions
            </p>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(suggestion)}
                disabled={isLoading}
                className="group flex items-center gap-2 text-left text-sm px-3 py-2.5 rounded-xl border border-border/60 bg-card/80 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed milele-shadow"
              >
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="leading-tight">{suggestion}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Zone de chat - cote droit */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto pr-1" ref={scrollRef}>
            <div className="space-y-4 pb-4">

              {messages.length === 0 && (
                <div className="flex gap-3 items-end">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xl" role="img" aria-label="Malaika">👼</span>
                  </div>
                  <Card className="p-4 bg-card milele-shadow max-w-[85%] border-primary/15">
                    <p className="text-sm leading-relaxed">{t('malaika.greeting')}</p>
                  </Card>
                </div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 md:hidden pl-12">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(s)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 items-end ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                    message.role === 'user'
                      ? 'bg-primary border-primary/30'
                      : 'bg-gradient-to-br from-primary/25 to-accent/20 border-primary/25'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <span className="text-xl" role="img" aria-label="Malaika">👼</span>
                    )}
                  </div>
                  <Card className={`p-4 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground border-primary/30'
                      : 'bg-card milele-shadow border-primary/15'
                  }`}>
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return (
                          <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                            {part.text}
                          </p>
                        )
                      }
                      return null
                    })}
                  </Card>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 items-end">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-xl animate-pulse" role="img" aria-label="Malaika">👼</span>
                  </div>
                  <Card className="p-4 bg-card milele-shadow border-primary/15">
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Zone de saisie */}
          <div className="pt-4 border-t border-border/60">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('malaika.placeholder')}
                disabled={isLoading}
                className="flex-1 bg-card border-border/60 focus:border-primary/50"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">{t('malaika.send')}</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
