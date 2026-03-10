import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app/app-header'
import { FeedContent } from '@/components/app/feed-content'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id(id, display_name, avatar_url), memorials:memorial_id(id, name)')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: recentMemorials } = await supabase
    .from('memorials')
    .select('id, name, photo_url, type, death_date')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(5)

  // Helper function to transform Supabase array joins to single objects
  const transformProfile = (profiles: unknown) => 
    Array.isArray(profiles) ? profiles[0] || null : profiles

  // Transform posts - Supabase returns joins as arrays
  const transformedPosts = (posts || []).map(post => ({
    ...post,
    profiles: transformProfile(post.profiles),
    memorials: transformProfile(post.memorials)
  }))

  return (
    <>
      <AppHeader title="Fil d'actualité" />
      <FeedContent posts={transformedPosts} recentMemorials={recentMemorials || []} />
    </>
  )
}
