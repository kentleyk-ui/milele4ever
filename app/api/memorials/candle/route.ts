import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const db = serviceClient()

  const body = await req.json().catch(() => ({})) as {
    memorialId?: string
    authorName?: string
  }

  const memorialId = body.memorialId?.trim()
  const authorName = (body.authorName?.trim() || "Anonyme").slice(0, 80)

  if (!memorialId) {
    return NextResponse.json({ error: "Memorial invalide" }, { status: 400 })
  }

  const { data: memorial } = await db
    .from("memorials")
    .select("id")
    .eq("id", memorialId)
    .eq("is_active", true)
    .maybeSingle()

  if (!memorial) {
    return NextResponse.json({ error: "Memorial introuvable" }, { status: 404 })
  }

  const { error } = await db
    .from("tributes")
    .insert({
      memorial_id: memorialId,
      author_name: authorName,
      tribute_type: "candle",
      content: "Bougie allumee",
      is_approved: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
