'use client'

import Link from 'next/link'
import { PostCard } from '@/components/app/post-card'
import { CreatePostForm } from '@/components/app/create-post-form'

interface Memorial {
  id: string
  name: string
  type: string
  species: string | null
  birth_date: string | null
  death_date: string | null
  photo_url: string | null
  biography: string | null
  city: string | null
  country: string | null
  created_by: string
  profiles: { id: string; display_name: string; avatar_url: string | null } | null
}

interface Post {
  id: string
  content: string
  image_url: string | null
  post_type: string
  created_at: string
  profiles: { id: string; display_name: string; avatar_url: string | null } | null
  memorials: { id: string; name: string } | null
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function MemorialDetail({ memorial, posts, userId }: { memorial: Memorial; posts: Post[]; userId: string }) {
  return (
    <div className="flex flex-col">
      {/* Header with back button */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <Link href="/app/memorials" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span className="sr-only">Retour</span>
        </Link>
        <h1 className="text-lg font-semibold text-foreground truncate">{memorial.name}</h1>
      </header>

      {/* Memorial Info */}
      <div className="bg-primary/5 px-4 pt-6 pb-8 flex flex-col items-center text-center">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-3 border-card mb-4">
          {memorial.photo_url ? (
            <img src={memorial.photo_url} alt={memorial.name} className="h-full w-full object-cover" />
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-10 0c0-1.5.5-2 1-3 .5 1.5 1.5 2 2 2a3 3 0 0 0 2-7z" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-semibold text-foreground text-balance">{memorial.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {memorial.type === 'human' ? 'Humain' : 'Animal'}
          {memorial.species ? ` - ${memorial.species}` : ''}
        </p>

        {/* Dates */}
        <div className="flex items-center gap-2 mt-3">
          {memorial.birth_date && (
            <span className="text-xs text-muted-foreground">{formatDate(memorial.birth_date)}</span>
          )}
          {memorial.birth_date && memorial.death_date && (
            <span className="text-xs text-muted-foreground">-</span>
          )}
          {memorial.death_date && (
            <span className="text-xs text-muted-foreground">{formatDate(memorial.death_date)}</span>
          )}
        </div>

        {/* Location */}
        {(memorial.city || memorial.country) && (
          <p className="text-xs text-muted-foreground mt-1">
            {[memorial.city, memorial.country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Biography */}
        {memorial.biography && (
          <p className="text-sm text-foreground mt-4 leading-relaxed text-pretty max-w-md">{memorial.biography}</p>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Cree par {memorial.profiles?.display_name || 'Utilisateur'}
        </p>
      </div>

      {/* Posts section */}
      <div className="flex flex-col gap-4 p-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Hommages et souvenirs</h3>
        <CreatePostForm userId={userId} memorialId={memorial.id} />

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">Aucun hommage pour le moment.</p>
            <p className="text-xs text-muted-foreground">Soyez le premier a partager un souvenir.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
