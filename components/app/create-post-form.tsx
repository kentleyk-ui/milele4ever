'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function CreatePostForm() {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        post_type: 'memory',
      })
      setContent('')
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Partagez un souvenir..."
        className="w-full min-h-[80px] resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <div className="flex justify-end mt-2">
        <Button type="submit" size="sm" disabled={isLoading || !content.trim()}>
          {isLoading ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </form>
  )
}
