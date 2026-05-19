import { NextRequest, NextResponse } from "next/server"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"
import { enforceRateLimit, serviceClient } from "@/lib/server/api-security"

export async function GET(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { key: "feedback-history", limit: 50, windowMs: 60_000 })
    if (limited) return limited

    // Get feedback ID from query params
    const id = req.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
    }

    const supabaseAdmin = serviceClient()

    // Get feedback with all history info
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      void sendTelegramErrorAlert({
        route: "/api/feedback/history:GET",
        message: "Feedback not found",
        statusCode: 404,
      })
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      type: data.type,
      type_label: data.type_label,
      message: data.message,
      status: data.status,
      note: data.note,
      url: data.url,
      user_agent: data.user_agent,
      created_at: data.created_at,
      updated_at: data.updated_at,
    })
  } catch (error) {
    console.error("Feedback history API error:", error)
    void sendTelegramErrorAlert({
      route: "/api/feedback/history:GET",
      message: "Exception feedback history",
      details: String(error),
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
