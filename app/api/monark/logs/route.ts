import { NextRequest, NextResponse } from "next/server"
import { monarkLogger, type MonarkLogType } from "@/lib/server/monarkLogger"

const MONARK_SECRET = process.env.MONARK_SECRET ?? "ton_secret_ultra_securise_ici_2024"

function parseLimit(raw: string | null) {
  const parsed = Number.parseInt(raw ?? "50", 10)
  if (!Number.isFinite(parsed)) return 50
  return Math.max(1, Math.min(parsed, 200))
}

function parseType(raw: string | null): MonarkLogType | null {
  if (!raw) return null
  const value = raw.toLowerCase()
  if (value === "error" || value === "info" || value === "debug" || value === "request" || value === "response" || value === "auth") {
    return value
  }
  return null
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== MONARK_SECRET) {
    return NextResponse.json({ error: "Acces refuse", message: "Secret invalide" }, { status: 403 })
  }

  const limit = parseLimit(req.nextUrl.searchParams.get("limit"))
  const type = parseType(req.nextUrl.searchParams.get("type"))

  const logs = monarkLogger.getLogs({ limit, type: type ?? undefined })

  return NextResponse.json({
    success: true,
    total: logs.length,
    logs,
    types: ["auth", "error", "request", "info", "debug", "response"],
    timestamp: new Date().toISOString(),
  })
}
