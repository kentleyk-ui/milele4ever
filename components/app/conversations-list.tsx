"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface Conversation {
  conversation_id: string
  last_read_at: string | null
  conversations: {
    id: string
    updated_at: string
    conversation_participants: Array<{
      user_id: string
      profiles: Profile
    }>
  }
  lastMessage: {
    id: string
    content: string
    created_at: string
    sender_id: string
    is_read: boolean
  } | null
  unreadCount: number
}

interface ConversationsListProps {
  conversations: Conversation[]
  currentUserId: string
}

export function ConversationsList({ conversations, currentUserId }: ConversationsListProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune conversation</h3>
        <p className="text-muted-foreground text-sm">
          Commencez une nouvelle conversation avec un membre
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => {
        // Get the other participant(s)
        const otherParticipants = conversation.conversations.conversation_participants
          .filter(p => p.user_id !== currentUserId)
          .map(p => p.profiles)

        const displayName = otherParticipants.map(p => p.full_name).join(", ") || "Conversation"
        const avatar = otherParticipants[0]

        return (
          <Link
            key={conversation.conversation_id}
            href={`/app/messages/${conversation.conversation_id}`}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatar?.avatar_url || undefined} />
              <AvatarFallback>
                {avatar?.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-foreground' : ''}`}>
                  {displayName}
                </p>
                {conversation.lastMessage && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { 
                      addSuffix: false,
                      locale: fr 
                    })}
                  </span>
                )}
              </div>
              
              {conversation.lastMessage && (
                <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {conversation.lastMessage.sender_id === currentUserId && "Vous: "}
                  {conversation.lastMessage.content}
                </p>
              )}
            </div>

            {conversation.unreadCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 flex items-center justify-center rounded-full">
                {conversation.unreadCount}
              </Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}
