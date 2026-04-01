'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { ArrowLeft, Send, User, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

// Composant SVG ange réaliste et dynamique
function AngelIcon({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="angel-wing-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#4ade80" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="angel-wing-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#4ade80" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="angel-robe" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
        <linearGradient id="angel-halo" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fde047" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0.6" />
        </linearGradient>
        <filter id="angel-glow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Aile gauche */}
      <path
        d="M8 28 C4 22, 2 16, 6 12 C10 8, 16 10, 20 14 C18 18, 16 24, 18 30 C14 30, 10 30, 8 28 Z"
        fill="url(#angel-wing-left)"
        className="angel-wing-left"
      />
      <path
        d="M10 26 C8 22, 6 18, 8 14 C12 12, 16 14, 18 18"
        stroke="#16a34a"
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      
      {/* Aile droite */}
      <path
        d="M56 28 C60 22, 62 16, 58 12 C54 8, 48 10, 44 14 C46 18, 48 24, 46 30 C50 30, 54 30, 56 28 Z"
        fill="url(#angel-wing-right)"
        className="angel-wing-right"
      />
      <path
        d="M54 26 C56 22, 58 18, 56 14 C52 12, 48 14, 46 18"
        stroke="#16a34a"
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      
      {/* Auréole */}
      <ellipse
        cx="32"
        cy="14"
        rx="10"
        ry="3"
        fill="url(#angel-halo)"
        filter="url(#angel-glow)"
        className="angel-halo"
      />
      
      {/* Tête */}
      <circle cx="32" cy="24" r="8" fill="#fef3c7" />
      <circle cx="32" cy="24" r="7.5" fill="#fef9c3" />
      
      {/* Visage */}
      <ellipse cx="29" cy="23" rx="1" ry="1.2" fill="#166534" opacity="0.8" />
      <ellipse cx="35" cy="23" rx="1" ry="1.2" fill="#166534" opacity="0.8" />
      <path d="M30 27 Q32 29 34 27" stroke="#16a34a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      
      {/* Cheveux */}
      <path
        d="M24 22 C24 18, 28 14, 32 14 C36 14, 40 18, 40 22 C40 20, 38 17, 32 17 C26 17, 24 20, 24 22 Z"
        fill="#a16207"
        opacity="0.7"
      />
      
      {/* Robe */}
      <path
        d="M26 32 C24 32, 22 36, 20 48 L32 52 L44 48 C42 36, 40 32, 38 32 C36 32, 34 34, 32 34 C30 34, 28 32, 26 32 Z"
        fill="url(#angel-robe)"
        stroke="#bbf7d0"
        strokeWidth="0.5"
      />
      
      {/* Mains */}
      <ellipse cx="22" cy="40" rx="2.5" ry="2" fill="#fef3c7" />
      <ellipse cx="42" cy="40" rx="2.5" ry="2" fill="#fef3c7" />
      
      {/* Etoiles scintillantes */}
      <circle cx="12" cy="36" r="1" fill="#4ade80" className="angel-sparkle-1" />
      <circle cx="52" cy="36" r="1" fill="#4ade80" className="angel-sparkle-2" />
      <circle cx="18" cy="44" r="0.8" fill="#22c55e" className="angel-sparkle-3" />
      <circle cx="46" cy="44" r="0.8" fill="#22c55e" className="angel-sparkle-4" />
    </svg>
  )
}

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
          <Button variant="ghost" size="icon">
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('common.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-50 via-green-100/50 to-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                <AngelIcon size={32} className="angel-animated" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-lg leading-tight flex items-center gap-2">
                {t('malaika.title')}
                <Sparkles className="h-4 w-4 text-primary/60" />
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">{t('malaika.subtitle')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Corps principal : suggestions gauche + chat droite */}
      <div className="flex-1 flex overflow-hidden container max-w-6xl px-4 py-6 gap-6">

        {/* Panneau de suggestions - cote gauche */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 gap-3">
          {/* Carte avatar ange gardien - design elegant */}
          <Card className="p-6 flex flex-col items-center text-center gap-4 border-primary/15 bg-gradient-to-b from-card via-card to-green-50/30 shadow-lg">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-50 via-white to-green-100/50 border-2 border-primary/20 flex items-center justify-center shadow-md">
                <AngelIcon size={56} className="angel-animated" />
              </div>
              {/* Cercle animé subtil */}
              <div className="absolute inset-0 rounded-full border border-primary/10 scale-125 animate-ping" style={{ animationDuration: '4s' }} />
            </div>
            <div className="space-y-1">
              <p className="font-serif font-bold text-lg text-foreground flex items-center justify-center gap-2">
                {t('malaika.title')}
                <Sparkles className="h-4 w-4 text-yellow-500/70" />
              </p>
              <p className="text-xs text-muted-foreground">{t('malaika.subtitle')}</p>
            </div>
            <div className="w-full pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                {t('malaika.greeting')}
              </p>
            </div>
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
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-50 to-green-100/50 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <AngelIcon size={28} className="angel-animated" />
                  </div>
                  <Card className="p-4 bg-gradient-to-br from-card to-green-50/20 shadow-md max-w-[85%] border-primary/10">
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
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                    message.role === 'user'
                      ? 'bg-primary border-primary/30'
                      : 'bg-gradient-to-br from-green-50 to-green-100/50 border-primary/20'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <AngelIcon size={26} className="angel-animated" />
                    )}
                  </div>
                  <Card className={`p-4 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground border-primary/30 shadow-md'
                      : 'bg-gradient-to-br from-card to-green-50/20 shadow-md border-primary/10'
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
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-50 to-green-100/50 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <AngelIcon size={26} className="angel-animated animate-pulse" />
                  </div>
                  <Card className="p-4 bg-gradient-to-br from-card to-green-50/20 shadow-md border-primary/10">
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
