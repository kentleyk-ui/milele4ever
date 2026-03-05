'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreatePostForm({ userId, memorialId }: { userId: string; memorialId?: string }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    await supabase.from('posts').insert({
      user_id: userId,
      content: content.trim(),
      memorial_id: memorialId || null,
      post_type: memorialId ? 'memory' : 'text',
    })

    setContent('')
    setIsLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-4">
      <textarea
        placeholder={memorialId ? "Partagez un souvenir, une pensee..." : "Quoi de neuf ? Partagez une pensee..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
      />
      <div className="flex items-center justify-end pt-2 border-t border-border mt-2">
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isLoading}
          className="h-8 px-4 text-xs"
        >
          {isLoading ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </form>
  )
}
