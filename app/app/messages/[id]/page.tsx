import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ChatView } from "@/components/app/chat-view"

export const dynamic = 'force-dynamic'

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

  // Helper function to transform Supabase array joins to single objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformProfile = (profiles: any) => 
    Array.isArray(profiles) ? profiles[0] ?? null : profiles ?? null

  // Get the conversation object - Supabase returns joins as arrays
  const conversation = Array.isArray(participation.conversations) 
    ? participation.conversations[0] 
    : participation.conversations

  // Get other participants for header
  const otherParticipants = (conversation?.conversation_participants || [])
    .filter((p: { user_id: string }) => p.user_id !== user.id)
    .map((p: { profiles: unknown }) => transformProfile(p.profiles))

  // Transform messages
  const transformedMessages = (messages || []).map(m => ({
    ...m,
    profiles: transformProfile(m.profiles)
  }))

  return (
    <ChatView
      conversationId={id}
      currentUser={{
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email || "Moi",
        avatar_url: user.user_metadata?.avatar_url || null,
      }}
      otherParticipants={otherParticipants}
      initialMessages={transformedMessages}
    />
  )
}
