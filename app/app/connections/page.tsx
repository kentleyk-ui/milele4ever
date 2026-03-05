import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app/app-header'
import { ConnectionsList } from '@/components/app/connections-list'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get accepted connections
  const { data: connections } = await supabase
    .from('connections')
    .select('*, requester:requester_id(id, display_name, avatar_url, city), addressee:addressee_id(id, display_name, avatar_url, city)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  // Get pending requests received
  const { data: pendingRequests } = await supabase
    .from('connections')
    .select('*, requester:requester_id(id, display_name, avatar_url, city)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  // Get all users for search (excluding self)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, city')
    .neq('id', user.id)
    .limit(50)

  return (
    <>
      <AppHeader title="Connexions" />
      <ConnectionsList
        userId={user.id}
        connections={connections || []}
        pendingRequests={pendingRequests || []}
        allUsers={allUsers || []}
      />
    </>
  )
}
