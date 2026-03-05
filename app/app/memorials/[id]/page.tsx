import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MemorialDetail } from "@/components/app/memorial-detail"

interface MemorialPageProps {
  params: Promise<{ id: string }>
}

export default async function MemorialPage({ params }: MemorialPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: memorial, error } = await supabase
    .from("memorials")
    .select(`
      *,
      profiles:created_by(full_name, avatar_url),
      memorial_members(
        id,
        role,
        relationship,
        user_id,
        profiles:user_id(full_name, avatar_url)
      ),
      posts(
        id,
        content,
        post_type,
        created_at,
        profiles:author_id(full_name, avatar_url),
        media(id, url, media_type, caption)
      ),
      candles(id, message, created_at, profiles:lit_by(full_name)),
      timeline_events(id, title, event_date, event_type),
      media(id, url, media_type, caption, taken_at)
    `)
    .eq("id", id)
    .single()

  if (error || !memorial) {
    notFound()
  }

  // Check if user is a member
  const isMember = memorial.memorial_members?.some(
    (m: { user_id: string }) => m.user_id === user.id
  ) || memorial.created_by === user.id

  const userRole = memorial.created_by === user.id 
    ? "owner" 
    : memorial.memorial_members?.find((m: { user_id: string }) => m.user_id === user.id)?.role || "viewer"

  return (
    <MemorialDetail 
      memorial={memorial} 
      currentUserId={user.id}
      isMember={isMember}
      userRole={userRole}
    />
  )
}
