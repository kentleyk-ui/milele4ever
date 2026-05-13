import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app/app-header'
import { FeedContent } from '@/components/app/feed-content'
import { getTranslation } from '@/lib/i18n/translations'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const title = getTranslation('fr', 'app.feed')
  const supabase = await createClient()

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

  // Transform posts - Supabase returns joins as arrays, components expect single objects
  const transformJoin = <T,>(val: T | T[] | null | undefined): T | null =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null)

  const transformedPosts = (posts || []).map(post => ({
    ...post,
    profiles: transformJoin(post.profiles),
    memorials: transformJoin(post.memorials)
  }))

  return (
    <>
      <AppHeader title={title} />
      <FeedContent posts={transformedPosts} recentMemorials={recentMemorials || []} />
    </>
  )
}
