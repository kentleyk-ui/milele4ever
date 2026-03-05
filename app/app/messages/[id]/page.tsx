import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatView } from '@/components/app/chat-view'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify user is participant
  const { data: participation } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .single()

  if (!participation) notFound()

  // Get other participant
  const { data: otherParticipant } = await supabase
    .from('conversation_participants')
    .select('profiles:user_id(id, display_name, avatar_url)')
    .eq('conversation_id', id)
    .neq('user_id', user.id)
    .single()

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles:sender_id(id, display_name, avatar_url)')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return (
    <ChatView
      conversationId={id}
      userId={user.id}
      otherUser={otherParticipant?.profiles || { id: '', display_name: 'Utilisateur', avatar_url: null }}
      initialMessages={messages || []}
    />
  )
}
