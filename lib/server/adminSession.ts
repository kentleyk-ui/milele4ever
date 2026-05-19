import crypto from "crypto"
import type { NextRequest } from "next/server"

type AdminArea = "staff" | "suggestions"

const COOKIE_NAME = "milele_admin_staff"
const SESSION_TTL_SECONDS = 60 * 60 * 8

function getAreaSecret(area: AdminArea): string {
  const secret = area === "suggestions"
    ? process.env.SUGGESTIONS_ADMIN_SECRET || process.env.STAFF_ADMIN_SECRET
    : process.env.STAFF_ADMIN_SECRET

  return secret || ""
}

function sign(payloadBase64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url")
}

export function createAdminSessionToken(area: AdminArea, email: string): string | null {
  const secret = getAreaSecret(area)
  if (!secret) return null

  const payload = {
    a: area,
    e: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    m: email,
  }

  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
  const signature = sign(payloadBase64, secret)
  return `${payloadBase64}.${signature}`
}

export function hasAdminSession(req: NextRequest, area: AdminArea): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value
  if (!raw) return false

  const [payloadBase64, signature] = raw.split(".")
  if (!payloadBase64 || !signature) return false

  const secret = getAreaSecret(area)
  if (!secret) return false

  const expected = sign(payloadBase64, secret)

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return false
    }
  } catch {
    return false
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as { a?: string; e?: number }
    if (payload.a !== area) return false
    if (!payload.e || payload.e < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

export const adminSessionConfig = {
  cookieName: COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
}
