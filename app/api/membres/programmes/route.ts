import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

type ChecklistItem = {
  id: string
  phase: "48h" | "1semaine" | "1mois"
  done: boolean
}

type Defunt = {
  prenom?: string
  nom?: string
}

function summarizeChecklist(checklist: ChecklistItem[]) {
  const total = checklist.length
  const completed = checklist.filter((item) => item.done).length
  const byPhase = {
    "48h": checklist.filter((item) => item.phase === "48h").length,
    "1semaine": checklist.filter((item) => item.phase === "1semaine").length,
    "1mois": checklist.filter((item) => item.phase === "1mois").length,
  }
  const completedByPhase = {
    "48h": checklist.filter((item) => item.phase === "48h" && item.done).length,
    "1semaine": checklist.filter((item) => item.phase === "1semaine" && item.done).length,
    "1mois": checklist.filter((item) => item.phase === "1mois" && item.done).length,
  }

  return { total, completed, byPhase, completedByPhase }
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    void sendTelegramErrorAlert({
      route: "/api/membres/programmes:GET",
      message: "Non autorise",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    void sendTelegramErrorAlert({
      route: "/api/membres/programmes:GET",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  const { data: connections, error: connectionsError } = await supabaseAdmin
    .from("connections")
    .select("requester_id, target_id")
    .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
    .eq("status", "accepted")

  if (connectionsError) {
    void sendTelegramErrorAlert({
      route: "/api/membres/programmes:GET",
      message: "Erreur chargement connexions",
      details: connectionsError.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Impossible de charger les connexions" }, { status: 500 })
  }

  const memberIds = Array.from(new Set((connections ?? [])
    .map((connection) => connection.requester_id === user.id ? connection.target_id : connection.requester_id)
    .filter(Boolean))) as string[]

  if (memberIds.length === 0) {
    return NextResponse.json({ programmes: [] })
  }

  const dossiersWithExclusionsReq = supabaseAdmin
    .from("dossiers")
    .select("user_id, defunt, checklist, updated_at, excluded_member_ids")
    .in("user_id", memberIds)

  const [{ data: dossiersWithExclusions, error: dossiersWithExclusionsError }, { data: profiles, error: profilesError }] = await Promise.all([
    dossiersWithExclusionsReq,
    supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", memberIds),
  ])

  const missingExclusionColumn = !!dossiersWithExclusionsError && dossiersWithExclusionsError.code === "42703"
  const dossiersFallback = missingExclusionColumn
    ? await supabaseAdmin
        .from("dossiers")
        .select("user_id, defunt, checklist, updated_at")
        .in("user_id", memberIds)
    : null

  const dossiers = (dossiersFallback?.data ?? dossiersWithExclusions) as Array<{
    user_id: string
    defunt: Defunt | null
    checklist: ChecklistItem[] | null
    updated_at: string
    excluded_member_ids?: string[] | null
  }> | null

  const dossiersError = dossiersFallback?.error ?? dossiersWithExclusionsError

  if (dossiersError || profilesError) {
    void sendTelegramErrorAlert({
      route: "/api/membres/programmes:GET",
      message: "Erreur chargement programmes",
      details: dossiersError?.message ?? profilesError?.message ?? "unknown",
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Impossible de charger les programmes" }, { status: 500 })
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const programmes = (dossiers ?? [])
    .filter((row) => !((row.excluded_member_ids ?? []).includes(user.id)))
    .map((row) => {
    const profile = profileMap.get(row.user_id)
    const checklist = ((row.checklist ?? []) as ChecklistItem[])
    const defunt = ((row.defunt ?? {}) as Defunt)
    return {
      ownerId: row.user_id,
      displayName: profile?.display_name ?? "Membre Milele",
      avatarUrl: profile?.avatar_url ?? null,
      defuntName: [defunt.prenom, defunt.nom].filter(Boolean).join(" ") || null,
      updatedAt: row.updated_at,
      summary: summarizeChecklist(checklist),
    }
  })

  return NextResponse.json({ programmes })
}
