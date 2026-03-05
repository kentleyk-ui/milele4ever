import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MemorialDetail } from '@/components/app/memorial-detail'

export default async function MemorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memorial } = await supabase
    .from('memorials')
    .select('*, profiles:created_by(id, display_name, avatar_url)')
    .eq('id', id)
    .single()

  if (!memorial) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id(id, display_name, avatar_url), memorials:memorial_id(id, name)')
    .eq('memorial_id', id)
    .order('created_at', { ascending: false })

  return (
    <MemorialDetail
      memorial={memorial}
      posts={posts || []}
      userId={user?.id || ''}
    />
  )
}
