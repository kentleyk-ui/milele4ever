import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(req: NextRequest) {
  const db = serviceClient()

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await db.auth.getUser(token)
  const user = authData.user

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    memorialId?: string
    displayName?: string
    years?: string
    quote?: string
    createdBy?: string
  }

  const memorialId = body.memorialId?.trim()
  if (!memorialId) {
    return NextResponse.json({ error: "Memorial invalide" }, { status: 400 })
  }

  const { data: memorial, error: memorialError } = await db
    .from("memorials")
    .select("id, user_id, settings")
    .eq("id", memorialId)
    .maybeSingle()

  if (memorialError || !memorial) {
    return NextResponse.json({ error: "Memorial introuvable" }, { status: 404 })
  }

  if (memorial.user_id !== user.id) {
    return NextResponse.json({ error: "Seul le proprietaire peut modifier ce memorial" }, { status: 403 })
  }

  const previousSettings = memorial.settings && typeof memorial.settings === "object"
    ? (memorial.settings as Record<string, unknown>)
    : {}

  const nextSettings: Record<string, unknown> = {
    ...previousSettings,
    years: (body.years ?? "").trim(),
    quote: (body.quote ?? "").trim(),
    created_by: (body.createdBy ?? "").trim(),
  }

  const nextDisplayName = (body.displayName ?? "").trim()

  const { error: updateError } = await db
    .from("memorials")
    .update({
      display_name: nextDisplayName.length > 0 ? nextDisplayName : undefined,
      settings: nextSettings,
    })
    .eq("id", memorialId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
