'use client'

import Link from 'next/link'
import { PostCard } from '@/components/app/post-card'
import { CreatePostForm } from '@/components/app/create-post-form'

interface Memorial {
  id: string
  name: string
  photo_url: string | null
  type: string
  death_date: string | null
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

export function FeedContent({
  posts,
  recentMemorials,
  userId,
}: {
  posts: Post[]
  recentMemorials: Memorial[]
  userId: string
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Recent Memorials Horizontal Scroll */}
      {recentMemorials.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Memoriaux recents</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentMemorials.map((memorial) => (
              <Link
                key={memorial.id}
                href={`/app/memorials/${memorial.id}`}
                className="flex flex-col items-center gap-2 min-w-[80px]"
              >
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {memorial.photo_url ? (
                    <img src={memorial.photo_url} alt={memorial.name} className="h-full w-full object-cover" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                      <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-10 0c0-1.5.5-2 1-3 .5 1.5 1.5 2 2 2a3 3 0 0 0 2-7z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-foreground text-center line-clamp-2 max-w-[80px]">{memorial.name}</span>
              </Link>
            ))}
            <Link
              href="/app/memorials/new"
              className="flex flex-col items-center gap-2 min-w-[80px]"
            >
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </div>
              <span className="text-xs text-muted-foreground text-center">Creer</span>
            </Link>
          </div>
        </section>
      )}

      {/* Create Post */}
      <CreatePostForm userId={userId} />

      {/* Posts Feed */}
      <section className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Aucune publication pour le moment.</p>
            <p className="text-xs text-muted-foreground">Partagez un souvenir ou creez un memorial.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} userId={userId} />
          ))
        )}
      </section>
    </div>
  )
}
