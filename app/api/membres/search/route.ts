import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

/* ═══════════════════════════════════════════════════════════════
  GET /api/membres/search?q=...
  Recherche des membres Milele par nom ou email (profiles table).
  Requiert un token Supabase valide en Authorization header.
  ═══════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Vérifier l'authentification
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    void sendTelegramErrorAlert({
      route: "/api/membres/search:GET",
      message: "Non autorise",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    void sendTelegramErrorAlert({
      route: "/api/membres/search:GET",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }
  if (q.length > 100) {
    void sendTelegramErrorAlert({
      route: "/api/membres/search:GET",
      message: "Terme de recherche trop long",
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Terme de recherche trop long" }, { status: 400 })
  }

  // Chercher dans la table profiles
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, visibility")
    .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
    .neq("id", user.id) // Exclure soi-même
    .eq("visibility", "public") // Uniquement les profils publics
    .limit(10)

  if (error) {
    void sendTelegramErrorAlert({
      route: "/api/membres/search:GET",
      message: "Erreur recherche membres",
      details: error.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Erreur recherche" }, { status: 500 })
  }

  // Vérifier les connexions existantes pour éviter les doublons
  const { data: existingConnections } = await supabaseAdmin
    .from("connections")
    .select("target_id, status")
    .eq("requester_id", user.id)
    .in("target_id", (data ?? []).map((p: { id: string }) => p.id))

  const existingMap = new Map(
    (existingConnections ?? []).map((c: { target_id: string; status: string }) => [c.target_id, c.status])
  )

  const results = (data ?? []).map((profile: { id: string; display_name: string; avatar_url: string | null; visibility: string }) => ({
    ...profile,
    connectionStatus: existingMap.get(profile.id) ?? null,
  }))

  return NextResponse.json({ results })
}
