'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { ArrowLeft, Send, Sparkles, User } from 'lucide-react'
import Link from 'next/link'

export default function MalaikaPage() {
  const { t, language } = useI18n()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/malaika',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          messages,
          id,
          language,
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when new messages arrive
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('common.back')}</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-lg">{t('malaika.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('malaika.subtitle')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container max-w-3xl px-4 py-6 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Card className="p-4 bg-card/80 max-w-[85%]">
                  <p className="text-sm leading-relaxed">{t('malaika.greeting')}</p>
                </Card>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-secondary' 
                    : 'bg-primary/10'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-secondary-foreground" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </div>
                <Card className={`p-4 max-w-[85%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/80'
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

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <Card className="p-4 bg-card/80">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="pt-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('malaika.placeholder')}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">{t('malaika.send')}</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
