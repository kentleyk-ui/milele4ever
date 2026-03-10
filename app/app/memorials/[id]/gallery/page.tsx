import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { GalleryGrid } from "@/components/app/gallery-grid"
import { UploadMediaButton } from "@/components/app/upload-media-button"

export const dynamic = 'force-dynamic'

interface GalleryPageProps {
  params: Promise<{ id: string }>
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: memorial, error } = await supabase
    .from("memorials")
    .select(`
      id,
      full_name,
      created_by,
      memorial_members(user_id, role)
    `)
    .eq("id", id)
    .single()

  if (error || !memorial) {
    notFound()
  }

  const { data: media } = await supabase
    .from("media")
    .select(`
      id,
      url,
      media_type,
      caption,
      taken_at,
      created_at,
      profiles:uploaded_by(full_name, avatar_url)
    `)
    .eq("memorial_id", id)
    .order("created_at", { ascending: false })

  const canEdit = memorial.created_by === user.id || 
    memorial.memorial_members?.some(
      (m: { user_id: string; role: string }) => m.user_id === user.id && (m.role === "owner" || m.role === "editor")
    )

  // Transform media to match expected type - Supabase returns joins as arrays
  const transformedMedia = (media || []).map(item => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles
  }))

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        title={`Galerie - ${memorial.full_name}`} 
        showBack 
        actions={canEdit ? <UploadMediaButton memorialId={id} /> : null}
      />

      <main className="flex-1 p-4 pb-24">
        <GalleryGrid media={transformedMedia} memorialId={id} />
      </main>
    </div>
  )
}
