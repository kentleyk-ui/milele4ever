import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

/* ═══════════════════════════════════════════════════════════════
  POST /api/membres/invite
  Body:
    - targetId?     string  (uuid Supabase si membre existant)
    - targetEmail?  string  (email si invitation externe)
    - category      string  (famille | amis | connaissances)
    - message?      string  (message personnalisé optionnel)
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
      route: "/api/membres/invite:POST",
      message: "Non autorise",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    void sendTelegramErrorAlert({
      route: "/api/membres/invite:POST",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }

  const body = await req.json()
  const { targetId, targetEmail, category, message } = body as {
    targetId?: string
    targetEmail?: string
    category: string
    message?: string
  }

  const validCategories = ["famille", "amis", "connaissances"]
  if (!category || !validCategories.includes(String(category))) {
    void sendTelegramErrorAlert({
      route: "/api/membres/invite:POST",
      message: "Categorie invalide",
      details: String(category),
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 })
  }

  if (!targetId && !targetEmail) {
    void sendTelegramErrorAlert({
      route: "/api/membres/invite:POST",
      message: "targetId ou targetEmail requis",
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "targetId ou targetEmail requis" }, { status: 400 })
  }

  // Validation UUID de targetId
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (targetId && !UUID_REGEX.test(String(targetId))) {
    return NextResponse.json({ error: "targetId invalide" }, { status: 400 })
  }

  // Validation format email
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (targetEmail && !EMAIL_REGEX.test(String(targetEmail))) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 })
  }

  const normalizedTargetEmail = targetEmail ? String(targetEmail).trim().toLowerCase() : null

  // Validation longueur message
  if (message && String(message).trim().length > 500) {
    return NextResponse.json({ error: "Le message ne peut pas dépasser 500 caractères" }, { status: 400 })
  }

  // Éviter les doublons
  if (targetId) {
    const { data: existing } = await supabaseAdmin
      .from("connections")
      .select("id, status")
      .eq("requester_id", user.id)
      .eq("target_id", targetId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Demande déjà envoyée", status: existing.status }, { status: 409 })
    }
  } else if (normalizedTargetEmail) {
    const { data: existingByEmail } = await supabaseAdmin
      .from("connections")
      .select("id, status")
      .eq("requester_id", user.id)
      .eq("target_email", normalizedTargetEmail)
      .in("status", ["invited", "pending", "accepted"])
      .maybeSingle()

    if (existingByEmail) {
      return NextResponse.json({ error: "Invitation déjà envoyée", status: existingByEmail.status }, { status: 409 })
    }
  }

  // Générer un token pour invitation externe
  const invitationToken = !targetId ? crypto.randomBytes(32).toString("hex") : null

  const { data: connection, error: insertError } = await supabaseAdmin
    .from("connections")
    .insert({
      requester_id: user.id,
      target_id: targetId ?? null,
      target_email: normalizedTargetEmail,
      category,
      message: message ?? null,
      status: targetId ? "pending" : "invited",
      invitation_token: invitationToken,
    })
    .select()
    .single()

  if (insertError) {
    console.error("Insert connection error:", insertError)
    void sendTelegramErrorAlert({
      route: "/api/membres/invite:POST",
      message: "Erreur insert connection",
      details: insertError.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }

  // Construire le lien d'invitation si externe
  const appUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "https://www.milele4ever.com"
  const invitationLink = invitationToken
    ? `${appUrl}/rejoindre?token=${invitationToken}`
    : null

  // Notification Telegram pour invitation externe
  if (invitationToken && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const requesterProfile = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()

    const name = requesterProfile.data?.display_name ?? user.email
    const tgMsg = `🌿 Nouvelle invitation Milele\n\nDe : ${name}\nPour : ${normalizedTargetEmail}\nCatégorie : ${category}\nLien : ${invitationLink}`

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: tgMsg,
        }),
      }
    ).catch(() => null)
  }

  return NextResponse.json({
    success: true,
    connectionId: connection.id,
    invitationLink,
    status: connection.status,
  })
}
