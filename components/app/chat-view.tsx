"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppHeader } from "@/components/app/app-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { fr } from "date-fns/locale"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface Message {
  id: string
  content: string
  message_type: string
  media_url: string | null
  created_at: string
  sender_id: string
  is_read: boolean
  profiles: Profile
}

interface ChatViewProps {
  conversationId: string
  currentUser: Profile
  otherParticipants: Profile[]
  initialMessages: Message[]
}

export function ChatView({ conversationId, currentUser, otherParticipants, initialMessages }: ChatViewProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const displayName = otherParticipants.map(p => p.full_name).join(", ")

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch full message with profile
          const { data: newMsg } = await supabase
            .from("messages")
            .select(`
              id,
              content,
              message_type,
              media_url,
              created_at,
              sender_id,
              is_read,
              profiles:sender_id(id, full_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single()

          if (newMsg) {
            setMessages(prev => [...prev, newMsg as Message])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: newMessage.trim(),
        message_type: "text",
      })

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, "HH:mm")
    } else if (isYesterday(date)) {
      return `Hier ${format(date, "HH:mm")}`
    }
    return format(date, "d MMM HH:mm", { locale: fr })
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  messages.forEach((msg) => {
    const dateStr = format(new Date(msg.created_at), "yyyy-MM-dd")
    const existing = groupedMessages.find(g => g.date === dateStr)
    if (existing) {
      existing.messages.push(msg)
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] })
    }
  })

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return "Aujourd'hui"
    if (isYesterday(date)) return "Hier"
    return format(date, "d MMMM yyyy", { locale: fr })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader 
        title={displayName} 
        showBack 
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center my-4">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {formatDateHeader(group.date)}
              </span>
            </div>

            {group.messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id
              const showAvatar = !isOwn && (
                index === 0 || 
                group.messages[index - 1]?.sender_id !== message.sender_id
              )

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && (
                    <div className="w-8">
                      {showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {message.profiles?.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
