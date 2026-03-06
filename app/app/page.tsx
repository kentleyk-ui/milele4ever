import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app/app-header'
import { FeedContent } from '@/components/app/feed-content'

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

  return (
    <>
      <AppHeader />
      <FeedContent posts={posts?.map(p => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        memorials: Array.isArray(p.memorials) ? p.memorials[0] : p.memorials
      })) || []} recentMemorials={recentMemorials || []} />
    </>
  )
}
