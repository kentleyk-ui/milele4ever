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
}: {
  posts: Post[]
  recentMemorials: Memorial[]
}) {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Recent Memorials Horizontal Scroll */}
      {recentMemorials.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Memoriaux recents</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentMemorials.map((memorial) => (
              <Link
                key={memorial.id}
                href={`/app/memorials/${memorial.id}`}
                className="flex-shrink-0 w-20 text-center group"
              >
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-muted border-2 border-primary/20 group-hover:border-primary transition-colors">
                  {memorial.photo_url ? (
                    <img src={memorial.photo_url} alt={memorial.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-xs text-foreground mt-1 block truncate">{memorial.name}</span>
              </Link>
            ))}
            <Link
              href="/app/memorials/new"
              className="flex-shrink-0 w-20 text-center group"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-xs text-primary mt-1 block">Creer</span>
            </Link>
          </div>
        </section>
      )}

      {/* Create Post */}
      <CreatePostForm />

      {/* Posts Feed */}
      <section className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-muted-foreground">Aucune publication pour le moment.</p>
            <p className="text-sm text-muted-foreground">Partagez un souvenir ou creez un memorial.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </section>
    </div>
  )
}
