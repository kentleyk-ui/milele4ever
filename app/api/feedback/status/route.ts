import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"
import { enforceRateLimit, requireApprovedAdmin, serviceClient } from "@/lib/server/api-security"
import { parseFeedbackMeta, stringifyFeedbackMeta } from "@/lib/feedback-meta"

const statusBodySchema = z.object({
  id: z.union([z.string().uuid(), z.string(), z.number().transform(String)]),
  status: z.string().trim().min(1).max(32),
  note: z.string().trim().max(400).optional(),
  adminComment: z.string().trim().max(700).optional(),
  resolutionSummary: z.string().trim().max(900).optional(),
  creatorReply: z.string().trim().max(900).optional(),
})

function normalizeIncomingStatus(status: string): "new" | "in-progress" | "done" | null {
  const s = (status || "").trim().toLowerCase()
  if (s === "new") return "new"
  if (s === "in-progress") return "in-progress"
  if (s === "done" || s === "closed" || s === "archived") return "done"
  return null
}

function mapFeedbackStatusToTicketStatus(status: "new" | "in-progress" | "done") {
  if (status === "new") return "Ouvert"
  if (status === "in-progress") return "En cours"
  return "Résolu"
}

function mapFeedbackTypeToTicketCategory(type: string | null | undefined) {
  const normalized = (type ?? "").toLowerCase()
  if (normalized === "bug") return "Technique"
  if (normalized === "design") return "Technique"
  if (normalized === "suggestion") return "Communication"
  if (normalized === "typo") return "Communication"
  return "Autre"
}

function makeTicketTitle(message: string | null | undefined) {
  const cleaned = String(message ?? "").trim()
  if (!cleaned) return "Suggestion sans titre"
  return (cleaned.split("\n")[0] || cleaned).slice(0, 100)
}

function makeTicketDescriptionFromFeedback(params: {
  feedbackId: string
  typeLabel: string | null | undefined
  type: string | null | undefined
  name: string | null | undefined
  message: string | null | undefined
  url: string | null | undefined
  note: string | null | undefined
}) {
  const { feedbackId, typeLabel, type, name, message, url, note } = params
  const content = String(message ?? "").trim()
  const lines = [
    `[FEEDBACK_ID:${feedbackId}]`,
    `Type: ${typeLabel || type || "Suggestion"}`,
    `De: ${name || "Anonyme"}`,
    "",
    content || "(Message vide)",
  ]

  if (url) lines.push("", `Page: ${url}`)
  if (note) lines.push("", `Statut suggestion: ${note}`)

  return lines.join("\n")
}

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { key: "feedback-status", limit: 30, windowMs: 60_000 })
    if (limited) return limited

    const admin = await requireApprovedAdmin(req)
    if (!admin) {
      void sendTelegramErrorAlert({
        route: "/api/feedback/status:POST",
        message: "Non autorise",
        statusCode: 401,
      })
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const parsed = statusBodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 })
    }

    const { id, status, note, adminComment, resolutionSummary, creatorReply } = parsed.data

    if (!id || !status) {
      void sendTelegramErrorAlert({
        route: "/api/feedback/status:POST",
        message: "Missing id or status",
        statusCode: 400,
      })
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }

    const normalizedStatus = normalizeIncomingStatus(status)
    if (!normalizedStatus) {
      void sendTelegramErrorAlert({
        route: "/api/feedback/status:POST",
        message: "Invalid status",
        details: String(status),
        statusCode: 400,
      })
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabaseAdmin = serviceClient()

    // Récupérer le feedback existant
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("feedbacks")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existing) {
      void sendTelegramErrorAlert({
        route: "/api/feedback/status:POST",
        message: "Feedback not found",
        statusCode: 404,
      })
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const meta = parseFeedbackMeta(existing.note)
    const newStatusNote = note !== undefined
      ? note
      : (normalizedStatus === "in-progress" ? "En cours" : normalizedStatus === "done" ? "Corrigé" : "Nouveau")

    const nextMeta = {
      ...meta,
      statusNote: newStatusNote,
      adminComment: adminComment !== undefined ? adminComment : meta.adminComment,
      resolutionSummary: resolutionSummary !== undefined ? resolutionSummary : meta.resolutionSummary,
      creatorReply: creatorReply !== undefined ? creatorReply : meta.creatorReply,
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("feedbacks")
      .update({ status: normalizedStatus, note: stringifyFeedbackMeta(nextMeta), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      void sendTelegramErrorAlert({
        route: "/api/feedback/status:POST",
        message: "Update failed",
        details: updateError.message,
        statusCode: 500,
      })
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    // Synchroniser le ticket lié à cette suggestion (status + fallback création si absent)
    const feedbackMarker = `[FEEDBACK_ID:${id}]`
    const syncedTicketStatus = mapFeedbackStatusToTicketStatus(normalizedStatus)
    const syncedTicketDescription = makeTicketDescriptionFromFeedback({
      feedbackId: String(id),
      typeLabel: updated.type_label,
      type: updated.type,
      name: updated.name,
      message: updated.message,
      url: updated.url,
      note: nextMeta.statusNote,
    })

    const { data: linkedTicket, error: linkedTicketError } = await supabaseAdmin
      .from("staff_tickets")
      .select("id")
      .ilike("description", `%${feedbackMarker}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (linkedTicketError) {
      console.error("[feedback/status] Ticket lookup error:", linkedTicketError)
    } else if (linkedTicket?.id) {
      const { error: ticketUpdateError } = await supabaseAdmin
        .from("staff_tickets")
        .update({
          status: syncedTicketStatus,
          description: syncedTicketDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", linkedTicket.id)

      if (ticketUpdateError) {
        console.error("[feedback/status] Ticket sync update error:", ticketUpdateError)
      }
    } else {
      const { error: ticketCreateError } = await supabaseAdmin
        .from("staff_tickets")
        .insert({
          title: makeTicketTitle(updated.message),
          description: syncedTicketDescription,
          status: syncedTicketStatus,
          priority: "Moyenne",
          category: mapFeedbackTypeToTicketCategory(updated.type),
          reporter_name: updated.name || "Milele Feedback System",
          created_at: updated.created_at || new Date().toISOString(),
        })

      if (ticketCreateError) {
        console.error("[feedback/status] Ticket sync create error:", ticketCreateError)
      }
    }

    const feedback = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      typeLabel: updated.type_label,
      message: updated.message,
      status: updated.status,
      note: nextMeta.statusNote,
      creatorUpdate: nextMeta.creatorUpdate ?? null,
      adminComment: nextMeta.adminComment ?? null,
      resolutionSummary: nextMeta.resolutionSummary ?? null,
      creatorReply: nextMeta.creatorReply ?? null,
      url: updated.url,
      date: updated.created_at,
    }

    let notificationInsertError: string | null = null

    if (normalizedStatus === "done" && meta.creatorUserId) {
      const actorName = admin.user.user_metadata?.full_name || admin.user.email || "Équipe Milele"
      const preview = String(updated.message ?? "").slice(0, 80)
      const resolutionText = (nextMeta.resolutionSummary || nextMeta.creatorReply || "Votre suivi a été marqué comme résolu.").slice(0, 220)

      const { error: notifError } = await supabaseAdmin.from("notifications").insert({
        user_id: meta.creatorUserId,
        actor_id: admin.user.id,
        actor_name: actorName,
        type: "feedback_resolved",
        publication_id: updated.id,
        publication_preview: `${preview} — ${resolutionText}`,
        read: false,
      })

      if (notifError) {
        notificationInsertError = notifError.message
        void sendTelegramErrorAlert({
          route: "/api/feedback/status:POST",
          message: "Notification feedback_resolved non insérée",
          details: notifError.message,
          statusCode: 500,
        })
      }
    }

    // ═══ Notification Telegram ═══
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      const statusLabel =
        normalizedStatus === "new" ? "🆕 Nouveau"
        : normalizedStatus === "in-progress" ? "🔄 En cours"
        : "✅ Corrigé"
      const text = [
        "🔔 Ticket mis à jour — Milele",
        ``,
        `${feedback.typeLabel}`,
        `De: ${feedback.name}`,
        ``,
        `${feedback.message}`,
        ``,
        `Statut: ${statusLabel}`,
        nextMeta.adminComment ? `Commentaire: ${nextMeta.adminComment}` : "",
        nextMeta.resolutionSummary ? `Résumé: ${nextMeta.resolutionSummary}` : "",
        nextMeta.creatorReply ? `Réponse créateur: ${nextMeta.creatorReply}` : "",
        feedback.url ? `Page: ${feedback.url}` : "",
      ].filter(Boolean).join("\n")

      try {
        const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
        })

        if (!telegramRes.ok) {
          const errorText = await telegramRes.text()
          console.error("Telegram sendMessage error (status):", telegramRes.status, errorText)
        }
      } catch (telegramError) {
        console.error("Telegram sendMessage network error (status):", telegramError)
      }
    }

    return NextResponse.json({
      success: true,
      feedback,
      notification: notificationInsertError
        ? { sent: false, error: notificationInsertError }
        : { sent: normalizedStatus === "done" && Boolean(meta.creatorUserId) },
    })
  } catch (error) {
    console.error("Feedback status API error:", error)
    void sendTelegramErrorAlert({
      route: "/api/feedback/status:POST",
      message: "Exception feedback status",
      details: String(error),
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
