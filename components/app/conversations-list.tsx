'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Conversation {
  id: string
  lastMessage: string | null
  lastMessageAt: string | null
  otherUser: { id: string; display_name: string | null; avatar_url: string | null } | null
}

interface Friend {
  id: string
  display_name: string | null
  avatar_url: string | null
}

function timeAgo(dateString: string | null) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'maintenant'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export function ConversationsList({
  userId,
  conversations,
  friends,
}: {
  userId: string
  conversations: Conversation[]
  friends: Friend[]
}) {
  const [showNewChat, setShowNewChat] = useState(false)
  const router = useRouter()

  const handleStartConversation = async (friendId: string) => {
    const supabase = createClient()

    // Check if conversation already exists
    const existingConv = conversations.find(c => c.otherUser?.id === friendId)
    if (existingConv) {
      router.push(`/app/messages/${existingConv.id}`)
      return
    }

    // Create new conversation
    const { data: conv } = await supabase.from('conversations').insert({}).select('id').single()
    if (!conv) return

    // Add both participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: userId },
      { conversation_id: conv.id, user_id: friendId },
    ])

    router.push(`/app/messages/${conv.id}`)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        <Button size="sm" className="h-8" onClick={() => setShowNewChat(!showNewChat)}>
          {showNewChat ? 'Annuler' : 'Nouveau message'}
        </Button>
      </div>

      {/* New chat picker */}
      {showNewChat && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">Choisir un contact</h3>
          {friends.length === 0 ? (
            <p className="text-xs text-muted-foreground">{"Vous n'avez pas encore de connexions. Ajoutez des amis d'abord."}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleStartConversation(friend.id)}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-card transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {friend.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{friend.display_name || 'Utilisateur'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversations list */}
      {conversations.length === 0 && !showNewChat ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
          <Button size="sm" variant="outline" onClick={() => setShowNewChat(true)}>Demarrer une conversation</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/app/messages/${conv.id}`}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">
                  {conv.otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{conv.otherUser?.display_name || 'Utilisateur'}</p>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
