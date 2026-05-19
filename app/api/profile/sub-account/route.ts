import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = adminClient()

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = authData.user

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  const body = await req.json() as { subAccountId?: string; displayName?: string }
  const subAccountId = body.subAccountId?.trim()
  const displayName = body.displayName?.trim()

  if (!subAccountId || !displayName) {
    return NextResponse.json({ error: "Parametres invalides" }, { status: 400 })
  }

  const { data: updated, error } = await supabaseAdmin
    .from("sub_accounts")
    .update({ display_name: displayName })
    .eq("id", subAccountId)
    .eq("owner_user_id", user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!updated) {
    return NextResponse.json({ error: "Sous-profil introuvable" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
