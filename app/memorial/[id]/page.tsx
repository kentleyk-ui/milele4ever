import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicMemorialView } from "@/components/memorial/public-memorial-view"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

interface MemorialPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MemorialPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: memorial } = await supabase
    .from("memorials")
    .select("full_name, biography")
    .eq("id", id)
    .eq("is_public", true)
    .single()

  if (!memorial) {
    return { title: "Mémorial non trouvé" }
  }

  return {
    title: `${memorial.full_name} - Milele`,
    description: memorial.biography?.slice(0, 160) || `Mémorial en l'honneur de ${memorial.full_name}`,
    openGraph: {
      title: `${memorial.full_name} - Milele`,
      description: memorial.biography?.slice(0, 160) || `Mémorial en l'honneur de ${memorial.full_name}`,
      type: 'profile',
    }
  }
}

export default async function PublicMemorialPage({ params }: MemorialPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch public memorial with all related data
  const { data: memorial, error } = await supabase
    .from("memorials")
    .select(`
      *,
      profiles:created_by(full_name, avatar_url),
      posts(
        id,
        content,
        post_type,
        created_at,
        profiles:author_id(full_name, avatar_url),
        media(id, url, media_type, caption)
      ),
      candles(id, message, created_at, profiles:lit_by(full_name)),
      timeline_events(id, title, description, event_date, event_type, location),
      media(id, url, media_type, caption, taken_at)
    `)
    .eq("id", id)
    .eq("is_public", true)
    .single()

  if (error || !memorial) {
    notFound()
  }

  // Transform Supabase array joins
  const transformProfile = (profiles: unknown) => 
    Array.isArray(profiles) ? profiles[0] || null : profiles

  const transformedMemorial = {
    ...memorial,
    profiles: transformProfile(memorial.profiles),
    posts: memorial.posts?.map((p: { profiles: unknown }) => ({
      ...p,
      profiles: transformProfile(p.profiles)
    })).sort((a: { created_at: string }, b: { created_at: string }) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    candles: memorial.candles?.map((c: { profiles: unknown }) => ({
      ...c,
      profiles: transformProfile(c.profiles)
    })),
    timeline_events: memorial.timeline_events?.sort((a: { event_date: string }, b: { event_date: string }) => 
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
  }

  return (
    <PublicMemorialView 
      memorial={transformedMemorial} 
      currentUserId={user?.id || null}
    />
  )
}
