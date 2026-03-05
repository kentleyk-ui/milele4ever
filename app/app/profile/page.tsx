import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileView } from '@/components/app/profile-view'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: memorials } = await supabase
    .from('memorials')
    .select('id, name, type, photo_url, death_date')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const { count: connectionsCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  return (
    <ProfileView
      profile={profile}
      email={user.email || ''}
      memorials={memorials || []}
      connectionsCount={connectionsCount || 0}
    />
  )
}
