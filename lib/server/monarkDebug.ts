import { NextRequest, NextResponse } from "next/server"
import { monarkLogger } from "@/lib/server/monarkLogger"

function maskValue(value: string | null, visible = 24) {
  if (!value) return null
  if (value.length <= visible) return value
  return `${value.slice(0, visible)}...`
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return { names: [] as string[], previewMap: {} as Record<string, string> }

  const previewMap: Record<string, string> = {}
  const names: string[] = []
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eqIndex = trimmed.indexOf("=")
    const key = (eqIndex === -1 ? trimmed : trimmed.slice(0, eqIndex)).trim()
    const value = eqIndex === -1 ? "" : trimmed.slice(eqIndex + 1).trim()
    if (!key) continue
    names.push(key)
    previewMap[key] = maskValue(value, 16) ?? ""
  }

  return { names, previewMap }
}

function hasAuthorization(req: NextRequest) {
  return req.headers.has("authorization") ? "PRESENT ✅" : "ABSENT ❌"
}

function cookieNames(req: NextRequest) {
  return req.cookies.getAll().map((cookie) => cookie.name)
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

function tokenPreview(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return "none"
  const token = auth.slice(7).trim()
  return token ? `${token.substring(0, 24)}...` : "none"
}

export function buildRequestDebug(req: NextRequest, extra: Record<string, unknown> = {}) {
  const authorization = req.headers.get("authorization")
  const cookieHeader = req.headers.get("cookie")
  return {
    method: req.method,
    url: req.nextUrl.pathname,
    query: Object.fromEntries(req.nextUrl.searchParams.entries()),
    headers: {
      authorization: hasAuthorization(req),
      authorizationPreview: maskValue(authorization, 32),
      contentType: req.headers.get("content-type"),
      userAgent: req.headers.get("user-agent"),
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      host: req.headers.get("host"),
      cookiePreview: maskValue(cookieHeader, 48),
    },
    cookies: cookieNames(req),
    session: "N/A (NextRequest + JWT)",
    user: null,
    tokenPreview: tokenPreview(req),
    ip: clientIp(req),
    ...extra,
  }
}

export function buildResponseDebug(req: NextRequest, res: NextResponse, startedAtMs: number, extra: Record<string, unknown> = {}) {
  return {
    method: req.method,
    url: req.nextUrl.pathname,
    status: res.status,
    durationMs: Date.now() - startedAtMs,
    responseSize: Number.parseInt(res.headers.get("content-length") ?? "0", 10) || 0,
    ...extra,
  }
}

async function safeReadErrorBody(res: NextResponse) {
  if (res.status < 400) return "[Success]"
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json") && !contentType.includes("text/")) {
    return "[Body non-textuel]"
  }
  try {
    const text = await res.clone().text()
    return text.length > 2000 ? `${text.slice(0, 2000)}...` : text
  } catch {
    return "[Body non lisible]"
  }
}

function authSummary(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const cookieHeader = req.headers.get("cookie")
  const bearerToken = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
  const parsedCookies = parseCookieHeader(cookieHeader)
  const hasAuthHeader = Boolean(auth)
  const authHeaderFormat = !auth
    ? "Absent ❌"
    : auth.startsWith("Bearer ")
      ? "Bearer Token ✅"
      : "Format incorrect ❌"

  return {
    hasAuthHeader,
    authHeaderFormat,
    authHeaderPreview: maskValue(auth, 32),
    tokenPreview: tokenPreview(req),
    bearerTokenPreview: maskValue(bearerToken, 24),
    cookieHeaderPreview: maskValue(cookieHeader, 48),
    hasCookies: req.cookies.getAll().length > 0,
    cookiesList: cookieNames(req),
    parsedCookies: parsedCookies.previewMap,
    cookieNamesFromHeader: parsedCookies.names,
    hasSession: false,
    sessionId: null,
    userId: null,
    userRole: null,
  }
}

export function withMonarkDebug(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: { routeName?: string }
) {
  return async function wrapped(req: NextRequest): Promise<NextResponse> {
    const startedAt = Date.now()
    const routeName = options?.routeName ?? req.nextUrl.pathname

    let response: NextResponse
    try {
      response = await handler(req)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      await monarkLogger.log("error", {
        message: "💥 ERREUR SERVEUR",
        routeName,
        request: buildRequestDebug(req),
        auth: authSummary(req),
        response: {
          statusCode: 500,
          statusMessage: "Internal Server Error",
          duration: `${Date.now() - startedAt}ms`,
          body: message,
        },
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }

    const duration = Date.now() - startedAt
    const body = await safeReadErrorBody(response)
    const payload = {
      routeName,
      request: buildRequestDebug(req),
      auth: authSummary(req),
      response: {
        statusCode: response.status,
        statusMessage: response.statusText,
        duration: `${duration}ms`,
        body,
      },
      timestamp: new Date().toISOString(),
    }

    if (response.status === 401) {
      await monarkLogger.log("auth", { message: "🚨 ERREUR 401 DÉTECTÉE", ...payload })
    } else if (response.status >= 500) {
      await monarkLogger.log("error", { message: "💥 ERREUR SERVEUR", ...payload })
    } else if (response.status >= 400) {
      await monarkLogger.log("error", { message: "⚠️ ERREUR CLIENT", ...payload })
    } else {
      await monarkLogger.log("request", payload)
    }

    return response
  }
}
