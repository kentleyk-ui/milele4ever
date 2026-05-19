import { NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"

type RateBucket = {
  count: number
  resetAt: number
}

type RateLimitConfig = {
  key: string
  limit: number
  windowMs: number
}

const rateBuckets = new Map<string, RateBucket>()

export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export function userScopedClient(token: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

export function extractBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.replace("Bearer ", "").trim()
  return token || null
}

export async function requireUser(req: NextRequest): Promise<{ user: User; token: string } | null> {
  const token = extractBearerToken(req)
  if (!token) return null

  const { data, error } = await userScopedClient(token).auth.getUser()
  if (error || !data.user) return null
  return { user: data.user, token }
}

export async function requireApprovedAdmin(req: NextRequest): Promise<{ user: User; token: string } | null> {
  const auth = await requireUser(req)
  if (!auth) return null

  const { data: profile } = await serviceClient()
    .from("staff_profiles")
    .select("role_id, status")
    .eq("user_id", auth.user.id)
    .single()

  const p = profile as { role_id?: string | null; status?: string | null } | null
  if (!p || p.status !== "approved" || p.role_id !== "admin-supreme") return null
  return auth
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

export function enforceRateLimit(req: NextRequest, config: RateLimitConfig): NextResponse | null {
  const now = Date.now()
  const ip = clientIp(req)
  const bucketKey = `${config.key}:${ip}`
  const bucket = rateBuckets.get(bucketKey)

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + config.windowMs })
    return null
  }

  if (bucket.count >= config.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: "Trop de requêtes, réessaie dans un instant." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  bucket.count += 1
  rateBuckets.set(bucketKey, bucket)
  return null
}