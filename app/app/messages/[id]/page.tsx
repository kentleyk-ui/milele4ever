import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ChatView } from "@/components/app/chat-view"

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is participant
  const { data: participation, error } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      conversations(
        id,
        conversation_participants(
          user_id,
          profiles:user_id(id, full_name, avatar_url)
        )
      )
    `)
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !participation) {
    notFound()
  }

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      message_type,
      media_url,
      created_at,
      sender_id,
      is_read,
      profiles:sender_id(id, full_name, avatar_url)
    `)
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  // Mark messages as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .eq("is_read", false)

  // Get other participants for header
  const otherParticipants = participation.conversations.conversation_participants
    .filter(p => p.user_id !== user.id)
    .map(p => p.profiles)

  return (
    <ChatView
      conversationId={id}
      currentUser={{
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email || "Moi",
        avatar_url: user.user_metadata?.avatar_url || null,
      }}
      otherParticipants={otherParticipants}
      initialMessages={messages || []}
    />
  )
}
