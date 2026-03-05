'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'

interface Post {
  id: string
  content: string
  image_url: string | null
  post_type: string
  created_at: string
  profiles: { id: string; display_name: string; avatar_url: string | null } | null
  memorials: { id: string; name: string } | null
}

const reactionTypes = [
  { type: 'heart', label: 'Coeur', icon: '♥' },
  { type: 'candle', label: 'Bougie', icon: '🕯' },
  { type: 'flower', label: 'Fleur', icon: '🌸' },
  { type: 'pray', label: 'Priere', icon: '🙏' },
  { type: 'hug', label: 'Soutien', icon: '🤗' },
]

function timeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'maintenant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function PostCard({ post, userId }: { post: Post; userId: string }) {
  const [showReactions, setShowReactions] = useState(false)

  const handleReact = async (type: string) => {
    const supabase = createClient()
    await supabase.from('reactions').upsert(
      { user_id: userId, post_id: post.id, type },
      { onConflict: 'user_id,post_id,type' }
    )
    setShowReactions(false)
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {post.profiles?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {post.profiles?.display_name || 'Utilisateur'}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
          {post.memorials && (
            <Link href={`/app/memorials/${post.memorials.id}`} className="text-xs text-primary hover:underline">
              En memoire de {post.memorials.name}
            </Link>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <div className="mt-3 rounded-xl overflow-hidden bg-muted">
          <img src={post.image_url} alt="" className="w-full object-cover max-h-80" />
        </div>
      )}

      {/* Reactions */}
      <div className="mt-3 flex items-center gap-1 relative">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
          </svg>
          Reagir
        </button>
        {showReactions && (
          <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 rounded-full bg-card border border-border p-1.5 shadow-lg">
            {reactionTypes.map((r) => (
              <button
                key={r.type}
                onClick={() => handleReact(r.type)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors text-base"
                title={r.label}
              >
                {r.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
