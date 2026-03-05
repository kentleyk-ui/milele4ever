import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { TimelineView } from "@/components/app/timeline-view"
import { AddTimelineEventButton } from "@/components/app/add-timeline-event-button"

interface TimelinePageProps {
  params: Promise<{ id: string }>
}

export default async function TimelinePage({ params }: TimelinePageProps) {
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
      date_of_birth,
      date_of_death,
      created_by,
      memorial_members(user_id, role)
    `)
    .eq("id", id)
    .single()

  if (error || !memorial) {
    notFound()
  }

  const { data: events } = await supabase
    .from("timeline_events")
    .select(`
      id,
      title,
      description,
      event_date,
      event_type,
      location,
      media_url,
      created_at,
      profiles:created_by(full_name)
    `)
    .eq("memorial_id", id)
    .order("event_date", { ascending: true, nullsFirst: false })

  const canEdit = memorial.created_by === user.id || 
    memorial.memorial_members?.some(
      (m: { user_id: string; role: string }) => m.user_id === user.id && (m.role === "owner" || m.role === "editor")
    )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        title={`Timeline - ${memorial.full_name}`} 
        showBack 
        actions={canEdit ? <AddTimelineEventButton memorialId={id} /> : null}
      />

      <main className="flex-1 p-4 pb-24">
        <TimelineView 
          events={events || []} 
          memorial={memorial}
          canEdit={canEdit}
        />
      </main>
    </div>
  )
}
