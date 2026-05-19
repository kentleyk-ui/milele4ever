import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  const body = await req.json() as { subscription: PushSubscriptionJSON }
  const { subscription } = body
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Subscription invalide" }, { status: 400 })
  }

  // Upsert la subscription dans la table push_subscriptions
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: subscription.endpoint, subscription: JSON.stringify(subscription) },
      { onConflict: "endpoint" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  const body = await req.json() as { endpoint: string }
  if (!body.endpoint) {
    return NextResponse.json({ error: "Endpoint manquant" }, { status: 400 })
  }
  await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", user.id)
  return NextResponse.json({ ok: true })
}
