import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = adminClient()

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = authData.user

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  const body = await req.json() as {
    displayName?: string
    avatarUrl?: string | null
    bio?: string | null
  }

  const displayName = body.displayName?.trim() || user.email?.split("@")[0] || "Membre"
  const bio = body.bio?.trim() || null
  const avatarUrl = body.avatarUrl?.trim() || null

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email ?? null,
      display_name: displayName,
      avatar_url: avatarUrl,
      bio,
    }, { onConflict: "id" })
    .select("id, email, display_name, avatar_url, bio, created_at, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: data })
}

// PATCH /api/profile — partial update (e.g. privacy_prefs)
export async function PATCH(req: NextRequest) {
  const supabaseAdmin = adminClient()

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = authData.user

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  const body = await req.json() as { privacy_prefs?: Record<string, unknown> }

  if (body.privacy_prefs === undefined) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        privacy_prefs: body.privacy_prefs,
      },
      { onConflict: "id" },
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}