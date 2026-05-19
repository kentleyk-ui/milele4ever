import { list } from "@vercel/blob"

export interface FeedbackItem {
  id: number
  name: string
  type: string
  typeLabel: string
  message: string
  status: string
  date: string
  note?: string
  url?: string
  userAgent?: string
  githubUrl?: string
}

interface FeedbackCache {
  expiresAt: number
  suggestions: FeedbackItem[]
  etag: string
  byPathname: Map<string, string>
}

const FEEDBACK_CACHE_TTL_MS = 25_000
let cache: FeedbackCache | null = null

function computeEtag(items: FeedbackItem[]): string {
  const digest = items.map((s) => `${s.id}:${s.status}:${s.date}`).join("|")
  return `W/\"${items.length}-${Buffer.from(digest).toString("base64url").slice(0, 24)}\"`
}

export function invalidateFeedbackCache() {
  cache = null
}

export async function loadFeedbackList(forceRefresh = false): Promise<FeedbackCache> {
  const now = Date.now()
  if (!forceRefresh && cache && cache.expiresAt > now) {
    return cache
  }

  const { blobs } = await list({ prefix: "feedback/" })

  if (blobs.length === 0) {
    cache = {
      expiresAt: now + FEEDBACK_CACHE_TTL_MS,
      suggestions: [],
      etag: "W/\"0-empty\"",
      byPathname: new Map(),
    }
    return cache
  }

  const parsed = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url, { cache: "no-store" })
        if (!res.ok) return null
        const payload = await res.json() as FeedbackItem
        return { payload, pathname: blob.pathname, url: blob.url }
      } catch {
        return null
      }
    })
  )

  const valid = parsed.filter((entry): entry is { payload: FeedbackItem; pathname: string; url: string } => Boolean(entry))
  const suggestions = valid.map((entry) => entry.payload).sort((a, b) => b.id - a.id)
  const byPathname = new Map(valid.map((entry) => [entry.pathname, entry.url]))

  cache = {
    expiresAt: now + FEEDBACK_CACHE_TTL_MS,
    suggestions,
    etag: computeEtag(suggestions),
    byPathname,
  }

  return cache
}

export async function findFeedbackBlobUrl(pathname: string): Promise<string | null> {
  const current = await loadFeedbackList(false)
  const cached = current.byPathname.get(pathname)
  if (cached) return cached

  const { blobs } = await list({ prefix: pathname })
  const blob = blobs.find((b) => b.pathname === pathname)
  return blob?.url ?? null
}
