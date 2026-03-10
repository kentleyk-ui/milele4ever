import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { FamilyTree } from "@/components/app/family-tree"
import { AddFamilyMemberButton } from "@/components/app/add-family-member-button"

export const dynamic = 'force-dynamic'

interface FamilyPageProps {
  params: Promise<{ id: string }>
}

export default async function FamilyPage({ params }: FamilyPageProps) {
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
      avatar_url,
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

  // Get family relationships
  const { data: relationships } = await supabase
    .from("family_relationships")
    .select(`
      id,
      relationship_type,
      related_memorial:related_memorial_id(
        id,
        full_name,
        avatar_url,
        date_of_birth,
        date_of_death
      )
    `)
    .eq("memorial_id", id)

  // Get all available memorials to link as family members
  const { data: availableMemorials } = await supabase
    .from("memorials")
    .select("id, full_name, avatar_url")
    .neq("id", id)
    .order("full_name")

  const canEdit = memorial.created_by === user.id || 
    memorial.memorial_members?.some(
      (m: { user_id: string; role: string }) => m.user_id === user.id && (m.role === "owner" || m.role === "editor")
    )

  // Transform relationships to match the expected type
  // Supabase returns joined data as arrays, but we need single objects
  const transformedRelationships = relationships?.map(r => ({
    id: r.id,
    relationship_type: r.relationship_type,
    related_memorial: Array.isArray(r.related_memorial) 
      ? r.related_memorial[0] || null 
      : r.related_memorial
  })) || []

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        title="Arbre familial" 
        showBack 
        actions={canEdit ? (
          <AddFamilyMemberButton 
            memorialId={id} 
            availableMemorials={availableMemorials || []}
            existingRelationships={transformedRelationships
              .map(r => r.related_memorial?.id)
              .filter(Boolean) as string[]}
          />
        ) : null}
      />

      <main className="flex-1 p-4 pb-24">
        <FamilyTree 
          centralPerson={memorial}
          relationships={transformedRelationships}
          canEdit={canEdit}
        />
      </main>
    </div>
  )
}
