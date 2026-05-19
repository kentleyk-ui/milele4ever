import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

/* ═══════════════════════════════════════════════════════════════
  POST /api/membres/accept
  Body:
    - connectionId  string   (uuid de la connexion)
    - action        string   (accept | decline)
  ═══════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Auth
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    void sendTelegramErrorAlert({
      route: "/api/membres/accept:POST",
      message: "Non autorise",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    void sendTelegramErrorAlert({
      route: "/api/membres/accept:POST",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    connectionId?: string
    invitationToken?: string
    action: "accept" | "decline" | "cancel"
  }
  const { connectionId, invitationToken, action } = body

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!connectionId && !invitationToken) {
    void sendTelegramErrorAlert({
      route: "/api/membres/accept:POST",
      message: "connectionId ou invitationToken requis",
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "connectionId ou invitationToken requis" }, { status: 400 })
  }
  if (connectionId && !UUID_REGEX.test(String(connectionId))) {
    return NextResponse.json({ error: "connectionId invalide" }, { status: 400 })
  }

  if (!action || !["accept", "decline", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Action invalide (accept | decline | cancel)" }, { status: 400 })
  }

  // Cas 1 : demande interne (connectionId)
  if (connectionId) {
    if (action === "cancel") {
      const { data: ownPending, error: ownPendingError } = await supabaseAdmin
        .from("connections")
        .select("id")
        .eq("id", connectionId)
        .eq("requester_id", user.id)
        .in("status", ["pending", "invited"])
        .maybeSingle()

      if (ownPendingError || !ownPending) {
        return NextResponse.json({ error: "Demande introuvable ou déjà traitée" }, { status: 404 })
      }

      const { error: deleteError } = await supabaseAdmin
        .from("connections")
        .delete()
        .eq("id", connectionId)

      if (deleteError) {
        void sendTelegramErrorAlert({
          route: "/api/membres/accept:POST",
          message: "Erreur annulation connexion",
          details: deleteError.message,
          statusCode: 500,
          actorId: user.id,
          actorEmail: user.email ?? null,
        })
        return NextResponse.json({ error: "Erreur annulation" }, { status: 500 })
      }

      return NextResponse.json({ success: true, status: "cancelled" })
    }

    const { data: connection, error: fetchError } = await supabaseAdmin
      .from("connections")
      .select("*")
      .eq("id", connectionId)
      .eq("target_id", user.id)
      .eq("status", "pending")
      .maybeSingle()

    if (fetchError || !connection) {
      return NextResponse.json({ error: "Demande introuvable ou déjà traitée" }, { status: 404 })
    }

    const newStatus = action === "accept" ? "accepted" : "declined"

    const { error: updateError } = await supabaseAdmin
      .from("connections")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", connectionId)

    if (updateError) {
      void sendTelegramErrorAlert({
        route: "/api/membres/accept:POST",
        message: "Erreur mise a jour connexion",
        details: updateError.message,
        statusCode: 500,
        actorId: user.id,
        actorEmail: user.email ?? null,
      })
      return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 })
    }

    if (action === "accept") {
      await supabaseAdmin.from("connections").upsert({
        requester_id: user.id,
        target_id: connection.requester_id,
        category: connection.category,
        status: "accepted",
      }, { onConflict: "requester_id,target_id" })
    }

    return NextResponse.json({ success: true, status: newStatus })
  }

  // Cas 2 : invitation externe par token
  const tokenValue = String(invitationToken ?? "").trim()
  if (!tokenValue || tokenValue.length < 16) {
    return NextResponse.json({ error: "invitationToken invalide" }, { status: 400 })
  }

  const { data: inviteConnection, error: inviteError } = await supabaseAdmin
    .from("connections")
    .select("id, requester_id, target_email, category, status")
    .eq("invitation_token", tokenValue)
    .eq("status", "invited")
    .maybeSingle()

  if (inviteError || !inviteConnection) {
    return NextResponse.json({ error: "Invitation introuvable ou expirée" }, { status: 404 })
  }

  const targetEmail = String(inviteConnection.target_email ?? "").trim().toLowerCase()
  const currentEmail = String(user.email ?? "").trim().toLowerCase()
  if (targetEmail && targetEmail !== currentEmail) {
    return NextResponse.json({ error: "Cette invitation est liée à une autre adresse e-mail" }, { status: 403 })
  }

  const newStatus = action === "accept" ? "accepted" : "declined"
  const { error: tokenUpdateError } = await supabaseAdmin
    .from("connections")
    .update({
      status: newStatus,
      target_id: user.id,
      updated_at: new Date().toISOString(),
      invitation_token: null,
    })
    .eq("id", inviteConnection.id)

  if (tokenUpdateError) {
    void sendTelegramErrorAlert({
      route: "/api/membres/accept:POST",
      message: "Erreur mise a jour invitation",
      details: tokenUpdateError.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Erreur mise à jour invitation" }, { status: 500 })
  }

  if (action === "accept") {
    await supabaseAdmin.from("connections").upsert({
      requester_id: user.id,
      target_id: inviteConnection.requester_id,
      category: inviteConnection.category,
      status: "accepted",
    }, { onConflict: "requester_id,target_id" })
  }

  return NextResponse.json({ success: true, status: newStatus })
}

/* ═══════════════════════════════════════════════════════════════
  GET /api/membres/accept
  Récupère les demandes en attente pour l'utilisateur connecté.
  ═══════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const invitationToken = req.nextUrl.searchParams.get("token")
  if (invitationToken) {
    const tokenValue = invitationToken.trim()
    const { data: invite, error } = await supabaseAdmin
      .from("connections")
      .select(`
        id, category, message, target_email, status, created_at,
        requester:profiles!connections_requester_id_fkey(id, display_name, avatar_url)
      `)
      .eq("invitation_token", tokenValue)
      .eq("status", "invited")
      .maybeSingle()

    if (error || !invite) {
      return NextResponse.json({ valid: false, error: "Invitation introuvable ou expirée" }, { status: 404 })
    }

    return NextResponse.json({ valid: true, invite })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    void sendTelegramErrorAlert({
      route: "/api/membres/accept:GET",
      message: "Non autorise",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    void sendTelegramErrorAlert({
      route: "/api/membres/accept:GET",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  // Connexions acceptées (mes membres)
  const { data: connections } = await supabaseAdmin
    .from("connections")
    .select(`
      id, category, status, created_at,
      target:profiles!connections_target_id_fkey(id, display_name, avatar_url),
      requester:profiles!connections_requester_id_fkey(id, display_name, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
    .in("status", ["accepted", "pending", "invited"])
    .order("created_at", { ascending: false })

  const pending = (connections ?? []).filter((c) =>
    c.status === "pending" && (c.target as Array<{id: string}> | null)?.[0]?.id === user.id
  )
  const accepted = (connections ?? []).filter((c) => c.status === "accepted")
  const sent = (connections ?? []).filter((c) =>
    ["pending", "invited"].includes(c.status) && (c.requester as Array<{id: string}> | null)?.[0]?.id === user.id
  )

  return NextResponse.json({ pending, accepted, sent })
}
