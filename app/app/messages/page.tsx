import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app/app-header'
import { ConversationsList } from '@/components/app/conversations-list'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's conversations with last message and other participant info
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  const conversationIds = participations?.map(p => p.conversation_id) || []

  let conversations: Array<{
    id: string
    lastMessage: string | null
    lastMessageAt: string | null
    otherUser: { id: string; display_name: string | null; avatar_url: string | null } | null
  }> = []

  if (conversationIds.length > 0) {
    const convData = await Promise.all(
      conversationIds.map(async (convId) => {
        // Get other participant
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id, profiles:user_id(id, display_name, avatar_url)')
          .eq('conversation_id', convId)
          .neq('user_id', user.id)
          .single()

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          id: convId,
          lastMessage: lastMsg?.content || null,
          lastMessageAt: lastMsg?.created_at || null,
          otherUser: otherParticipant?.profiles || null,
        }
      })
    )
    conversations = convData.sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
  }

  // Get connections for starting new conversations
  const { data: connections } = await supabase
    .from('connections')
    .select('*, requester:requester_id(id, display_name, avatar_url), addressee:addressee_id(id, display_name, avatar_url)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friends = (connections || []).map(c => {
    return c.requester_id === user.id ? c.addressee : c.requester
  }).filter(Boolean)

  return (
    <>
      <AppHeader title="Messages" />
      <ConversationsList
        userId={user.id}
        conversations={conversations}
        friends={friends}
      />
    </>
  )
}
