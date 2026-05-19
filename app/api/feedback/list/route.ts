import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"
import { enforceRateLimit, serviceClient } from "@/lib/server/api-security"
import { parseFeedbackMeta } from "@/lib/feedback-meta"

export async function GET(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { key: "feedback-list", limit: 20, windowMs: 60_000 })
    if (limited) return limited

    const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? "100")
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(200, Math.max(20, Math.trunc(requestedLimit)))
      : 100

    const supabaseAdmin = serviceClient()

    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .select("id, name, type, type_label, message, status, note, url, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Feedback list error:", error)
      void sendTelegramErrorAlert({
        route: "/api/feedback/list:GET",
        message: "Erreur chargement feedback list",
        details: error.message,
        statusCode: 500,
      })
      return NextResponse.json({ suggestions: [] }, { status: 500 })
    }

    const suggestions = (data ?? []).map((row) => {
      const meta = parseFeedbackMeta(row.note)
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        typeLabel: row.type_label,
        message: row.message,
        status: row.status,
        note: meta.statusNote ?? row.note,
        creatorUpdate: meta.creatorUpdate ?? null,
        creatorUpdateMethod: meta.creatorUpdateMethod ?? null,
        creatorUpdateContact: meta.creatorUpdateContact ?? null,
        adminComment: meta.adminComment ?? null,
        resolutionSummary: meta.resolutionSummary ?? null,
        creatorReply: meta.creatorReply ?? null,
        creatorUserId: meta.creatorUserId ?? null,
        url: row.url,
        userAgent: row.user_agent,
        date: row.created_at,
      }
    })

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    console.error("Feedback list API error:", error)
    void sendTelegramErrorAlert({
      route: "/api/feedback/list:GET",
      message: "Exception feedback list",
      details: String(error),
      statusCode: 500,
    })
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}
