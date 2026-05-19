import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { adminSessionConfig, createAdminSessionToken } from "@/lib/server/adminSession"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

type Area = "staff" | "suggestions"

function normalizeArea(value: unknown): Area {
  return value === "staff" ? "staff" : "suggestions"
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    void sendTelegramErrorAlert({
      route: "/api/admin/auto-session:POST",
      message: "Authorization manquante",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    void sendTelegramErrorAlert({
      route: "/api/admin/auto-session:POST",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { area?: string }
  const area = normalizeArea(body.area)

  const adminEmail = process.env.STAFF_ADMIN_EMAIL || "kentleyk@gmail.com"
  const userEmail = (user.email || "").toLowerCase()

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("staff_roles")
    .select("role, active")
    .eq("user_id", user.id)
    .eq("area", area)
    .maybeSingle()

  const hasRoleAccess = !roleError && !!roleRow && roleRow.active === true
  const hasFallbackEmailAccess = userEmail === adminEmail.toLowerCase()

  if (!hasRoleAccess && !hasFallbackEmailAccess) {
    void sendTelegramErrorAlert({
      route: "/api/admin/auto-session:POST",
      message: "Acces admin refuse",
      statusCode: 403,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sessionToken = createAdminSessionToken(area, user.email || adminEmail)
  if (!sessionToken) {
    void sendTelegramErrorAlert({
      route: "/api/admin/auto-session:POST",
      message: "Secret session admin manquant",
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Admin secret missing" }, { status: 500 })
  }

  const response = NextResponse.json({
    success: true,
    area,
    role: hasRoleAccess ? roleRow?.role || "admin" : "owner",
  })
  response.cookies.set({
    name: adminSessionConfig.cookieName,
    value: sessionToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: adminSessionConfig.maxAge,
  })

  return response
}
