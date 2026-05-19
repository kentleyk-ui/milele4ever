import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/server/supabase-server"
import { createClient } from "@supabase/supabase-js"

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
  )
}

/* ── GET /api/notifications — liste pour l'utilisateur connecté ── */
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const userClient = getUserClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Session invalide" }, { status: 401 })

  const { data, error } = await userClient
    .from("notifications")
    .select("id, actor_name, type, publication_id, publication_preview, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40)

  if (error) return NextResponse.json({ notifications: [] })
  return NextResponse.json({ notifications: data ?? [] })
}

/* ── POST /api/notifications — créer une notification ── */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })

  const userClient = getUserClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await req.json()) as {
    type: "like" | "comment"
    publication_id: string
  }
  if (!body.type || !body.publication_id) return NextResponse.json({ ok: false }, { status: 400 })

  const server = createServerSupabase()

  // Récupérer l'auteur + préview de la publication
  const { data: pub } = await server
    .from("publications")
    .select("user_id, content")
    .eq("id", body.publication_id)
    .maybeSingle() as { data: { user_id: string; content: string } | null }

  if (!pub || pub.user_id === user.id) {
    // Pas de notification si c'est sa propre publication
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Nom de l'acteur
  const { data: actorProfile } = await server
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle() as { data: { display_name: string | null } | null }

  const actorName = actorProfile?.display_name ?? "Un membre"
  const preview = pub.content.split("[[MILELE_META]]")[0].slice(0, 80)

  await server.from("notifications").insert({
    user_id: pub.user_id,
    actor_id: user.id,
    actor_name: actorName,
    type: body.type,
    publication_id: body.publication_id,
    publication_preview: preview,
    read: false,
  })

  return NextResponse.json({ ok: true })
}

/* ── PATCH /api/notifications — marquer tout comme lu ── */
export async function PATCH(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })

  const userClient = getUserClient(token)
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  await userClient
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)

  return NextResponse.json({ ok: true })
}
