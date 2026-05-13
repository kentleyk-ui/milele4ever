import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { ConversationsList } from "@/components/app/conversations-list"
import { NewConversationButton } from "@/components/app/new-conversation-button"

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's conversations
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      last_read_at,
      conversations(
        id,
        updated_at,
        conversation_participants(
          user_id,
          profiles:user_id(id, full_name, avatar_url)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("conversations(updated_at)", { ascending: false })

  // Get last message for each conversation
  const conversationsWithMessages = await Promise.all(
    (participations || []).map(async (p) => {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          created_at,
          sender_id,
          is_read
        `)
        .eq("conversation_id", p.conversation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // Get unread count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", p.conversation_id)
        .neq("sender_id", user.id)
        .eq("is_read", false)

      return {
        ...p,
        lastMessage,
        unreadCount: unreadCount || 0,
      }
    })
  )

  // Get all users for new conversation
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .neq("id", user.id)
    .order("full_name")

  // Helper function to transform Supabase array joins to single objects
  const transformJoin = <T,>(profiles: T | T[] | null | undefined): T | null =>
    Array.isArray(profiles) ? (profiles[0] ?? null) : (profiles ?? null)

  // Transform conversations data - Supabase returns joins as arrays
  const transformedConversations = conversationsWithMessages.map(conv => {
    // Handle conversations being an array from Supabase join
    const convData = Array.isArray(conv.conversations) ? conv.conversations[0] : conv.conversations
    
    return {
      ...conv,
      conversations: convData ? {
        ...convData,
        conversation_participants: (convData.conversation_participants || []).map(
          (p) => ({
            ...p,
            profiles: transformJoin(p.profiles)
          })
        )
      } : convData
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        title="Messages" 
        actions={<NewConversationButton users={allUsers || []} currentUserId={user.id} />}
      />

      <main className="flex-1 pb-24">
        <ConversationsList 
          conversations={transformedConversations} 
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
