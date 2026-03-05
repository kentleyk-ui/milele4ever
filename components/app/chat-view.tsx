'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  profiles: { id: string; display_name: string | null; avatar_url: string | null } | null
}

interface OtherUser {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export function ChatView({
  conversationId,
  userId,
  otherUser,
  initialMessages,
}: {
  conversationId: string
  userId: string
  otherUser: OtherUser
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  // Subscribe to new messages
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        // Attach profile info
        if (newMsg.sender_id === userId) {
          newMsg.profiles = { id: userId, display_name: 'Moi', avatar_url: null }
        } else {
          newMsg.profiles = otherUser
        }
        setMessages(prev => [...prev, newMsg])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId, otherUser])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setIsSending(false)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-svh bg-background">
      {/* Chat header */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <Link href="/app/messages" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span className="sr-only">Retour</span>
        </Link>
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {otherUser.display_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <span className="text-sm font-medium text-foreground truncate">{otherUser.display_name || 'Utilisateur'}</span>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Demarrez la conversation !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="border-t border-border bg-card px-4 py-3 pb-safe flex items-center gap-3 flex-shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ecrire un message..."
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 transition-opacity flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </svg>
          <span className="sr-only">Envoyer</span>
        </button>
      </form>
    </div>
  )
}
