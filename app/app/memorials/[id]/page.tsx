import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MemorialDetail } from "@/components/app/memorial-detail"

export const dynamic = 'force-dynamic'

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

  // Helper function to transform Supabase array joins to single objects
  const transformProfile = (profiles: unknown) => 
    Array.isArray(profiles) ? profiles[0] || null : profiles

  // Transform memorial data - Supabase returns joins as arrays
  const transformedMemorial = {
    ...memorial,
    profiles: transformProfile(memorial.profiles),
    memorial_members: memorial.memorial_members?.map((m: { profiles: unknown }) => ({
      ...m,
      profiles: transformProfile(m.profiles)
    })),
    posts: memorial.posts?.map((p: { profiles: unknown; media: unknown }) => ({
      ...p,
      profiles: transformProfile(p.profiles)
    })),
    candles: memorial.candles?.map((c: { profiles: unknown }) => ({
      ...c,
      profiles: transformProfile(c.profiles)
    }))
  }

  // Check if user is a member
  const isMember = transformedMemorial.memorial_members?.some(
    (m: { user_id: string }) => m.user_id === user.id
  ) || transformedMemorial.created_by === user.id

  const userRole = transformedMemorial.created_by === user.id 
    ? "owner" 
    : transformedMemorial.memorial_members?.find((m: { user_id: string }) => m.user_id === user.id)?.role || "viewer"

  return (
    <MemorialDetail 
      memorial={transformedMemorial} 
      currentUserId={user.id}
      isMember={isMember}
      userRole={userRole}
    />
  )
}
