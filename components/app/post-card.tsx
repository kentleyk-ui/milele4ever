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

export function PostCard({ post }: { post: Post }) {
  const [showReactions, setShowReactions] = useState(false)

  const handleReact = async (type: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('reactions').upsert(
        { user_id: user.id, post_id: post.id, type },
        { onConflict: 'user_id,post_id,type' }
      )
    }
    setShowReactions(false)
  }

  return (
    <article className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {post.profiles?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/app/profile/${post.profiles?.id}`} className="font-medium text-foreground hover:underline">
              {post.profiles?.display_name || 'Utilisateur'}
            </Link>
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
          {post.memorials && (
            <Link href={`/app/memorials/${post.memorials.id}`} className="text-xs text-primary hover:underline">
              En memoire de {post.memorials.name}
            </Link>
          )}
        </div>
      </div>

      <p className="mt-3 text-foreground leading-relaxed">{post.content}</p>

      {post.image_url && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img src={post.image_url} alt="" className="w-full object-cover max-h-80" />
        </div>
      )}

      {/* Reactions */}
      <div className="mt-4 flex items-center gap-2 relative">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          Reagir
        </button>
        {showReactions && (
          <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card shadow-lg rounded-full p-1 border border-border">
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
