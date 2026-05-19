import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"
import { stringifyFeedbackMeta } from "@/lib/feedback-meta"

const ALLOWED_TYPES = ["bug", "typo", "suggestion", "design", "autre"] as const
type FeedbackType = (typeof ALLOWED_TYPES)[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, message, date, url, userAgent, creatorUpdate, creatorUserId, creatorUpdateMethod, creatorUpdateContact } = body

    // ── Validation des champs obligatoires ──
    if (!type || !message) {
      void sendTelegramErrorAlert({
        route: "/api/feedback:POST",
        message: "Champs obligatoires manquants",
        statusCode: 400,
      })
      return NextResponse.json({ error: "Champs obligatoires manquants (type, message)" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(type as FeedbackType)) {
      void sendTelegramErrorAlert({
        route: "/api/feedback:POST",
        message: "Type feedback invalide",
        details: String(type),
        statusCode: 400,
      })
      return NextResponse.json(
        { error: `Type invalide. Valeurs acceptées : ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      )
    }

    const trimmedMessage = String(message).trim()
    if (trimmedMessage.length < 1 || trimmedMessage.length > 1000) {
      void sendTelegramErrorAlert({
        route: "/api/feedback:POST",
        message: "Longueur message invalide",
        statusCode: 400,
      })
      return NextResponse.json(
        { error: "Le message doit contenir entre 1 et 1000 caractères" },
        { status: 400 }
      )
    }

    const trimmedName = name ? String(name).trim().slice(0, 100) : "Anonyme"
    const trimmedCreatorUpdate = creatorUpdate ? String(creatorUpdate).trim().slice(0, 500) : ""
    const trimmedCreatorUserId = creatorUserId ? String(creatorUserId).trim().slice(0, 64) : ""
    const methodRaw = creatorUpdateMethod ? String(creatorUpdateMethod).trim().toLowerCase() : ""
    const normalizedMethod = methodRaw === "email" || methodRaw === "telegram" ? methodRaw : ""
    const trimmedCreatorContact = creatorUpdateContact ? String(creatorUpdateContact).trim().slice(0, 120) : ""

    if (normalizedMethod && !trimmedCreatorContact) {
      return NextResponse.json(
        { error: "Le contact est requis pour recevoir des updates" },
        { status: 400 }
      )
    }

    if (!normalizedMethod && trimmedCreatorContact) {
      return NextResponse.json(
        { error: "Sélectionnez un canal (courriel ou Telegram)" },
        { status: 400 }
      )
    }

    if (normalizedMethod === "email") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedCreatorContact)
      if (!emailOk) {
        return NextResponse.json(
          { error: "Adresse courriel invalide" },
          { status: 400 }
        )
      }
    }

    if (normalizedMethod === "telegram") {
      const telegramOk = /^@?[a-zA-Z0-9_]{5,32}$/.test(trimmedCreatorContact)
      if (!telegramOk) {
        return NextResponse.json(
          { error: "Identifiant Telegram invalide" },
          { status: 400 }
        )
      }
    }

    const creatorContactValue = normalizedMethod === "telegram" && trimmedCreatorContact && !trimmedCreatorContact.startsWith("@")
      ? `@${trimmedCreatorContact}`
      : trimmedCreatorContact

    // Validation optionnelle de l'URL
    let validatedUrl: string | undefined
    if (url) {
      try {
        validatedUrl = new URL(String(url)).toString()
      } catch {
        validatedUrl = undefined
      }
    }

    const typeLabels: Record<string, string> = {
      bug: "🐛 Bug",
      typo: "✏️ Faute d'orthographe",
      suggestion: "💡 Suggestion",
      design: "🎨 Problème visuel",
      autre: "📝 Autre",
    }

    // ═══ Sauvegarde dans Supabase ═══
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error: insertError } = await supabaseAdmin
      .from("feedbacks")
      .insert({
        name: trimmedName,
        type: type as FeedbackType,
        type_label: typeLabels[type] || type,
        message: trimmedMessage,
        status: "new",
        note: stringifyFeedbackMeta({
          statusNote: "Nouveau",
          creatorUpdate: normalizedMethod ? undefined : (trimmedCreatorUpdate || undefined),
          creatorUpdateMethod: normalizedMethod ? (normalizedMethod as "email" | "telegram") : undefined,
          creatorUpdateContact: creatorContactValue || undefined,
          creatorUserId: trimmedCreatorUserId || undefined,
        }),
        url: validatedUrl ?? null,
        user_agent: userAgent ? String(userAgent).slice(0, 300) : null,
        created_at: date && !isNaN(Date.parse(String(date))) ? String(date) : new Date().toISOString(),
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Feedback insert error:", insertError)
      void sendTelegramErrorAlert({
        route: "/api/feedback:POST",
        message: "Erreur insertion feedback",
        details: insertError.message,
        statusCode: 500,
      })
      return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    // ═══ Auto-créer un ticket à partir du feedback ═══
    const feedbackTypeToCategory: Record<FeedbackType, string> = {
      bug: "Technique",
      typo: "Communication",
      suggestion: "Communication",
      design: "Communication",
      autre: "Autre",
    }

    const feedbackTypeToPriority: Record<FeedbackType, string> = {
      bug: "Haute",
      typo: "Faible",
      suggestion: "Moyenne",
      design: "Moyenne",
      autre: "Faible",
    }

    const ticketCategory = feedbackTypeToCategory[type as FeedbackType] || "Autre"
    const ticketPriority = feedbackTypeToPriority[type as FeedbackType] || "Moyenne"
    const ticketTitle = trimmedMessage.split("\n")[0]?.slice(0, 100) || trimmedMessage.slice(0, 100)
    const ticketDescription = [
      `[FEEDBACK_ID:${data.id}]`,
      `Type: ${typeLabels[type] || type}`,
      `De: ${trimmedName}`,
      "",
      trimmedMessage,
      validatedUrl ? `\nPage: ${validatedUrl}` : "",
    ].filter(Boolean).join("\n")

    const { error: ticketError } = await supabaseAdmin.from("staff_tickets").insert({
      title: ticketTitle,
      description: ticketDescription,
      status: "Ouvert",
      priority: ticketPriority,
      category: ticketCategory,
      reporter_name: trimmedName,
      created_at: date && !isNaN(Date.parse(String(date))) ? String(date) : new Date().toISOString(),
    })

    if (ticketError) {
      console.error("Ticket auto-creation error:", ticketError)
      void sendTelegramErrorAlert({
        route: "/api/feedback:POST",
        message: "Erreur auto-création ticket depuis feedback",
        details: ticketError.message,
        statusCode: 500,
      })
      // On retourne quand même le succès du feedback, car c'est le principal
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      ticketCreated: !ticketError,
    })
  } catch (error) {
    console.error("Feedback API error:", error)
    void sendTelegramErrorAlert({
      route: "/api/feedback:POST",
      message: "Exception feedback",
      details: String(error),
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
