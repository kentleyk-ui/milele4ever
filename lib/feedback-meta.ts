export type HistoryEntry = {
  timestamp: string
  action: string
  actor?: string
  changes?: Record<string, unknown>
}

export type FeedbackMeta = {
  statusNote?: string
  creatorUpdate?: string
  creatorUpdateMethod?: "email" | "telegram"
  creatorUpdateContact?: string
  creatorUserId?: string
  adminComment?: string
  resolutionSummary?: string
  creatorReply?: string
  history?: HistoryEntry[]
}

const META_PREFIX = "__MILELE_META__"

export function parseFeedbackMeta(note: string | null | undefined): FeedbackMeta {
  const raw = (note ?? "").trim()
  if (!raw) return {}

  if (!raw.startsWith(META_PREFIX)) {
    return { statusNote: raw }
  }

  try {
    const payload = raw.slice(META_PREFIX.length)
    const parsed = JSON.parse(payload) as FeedbackMeta
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function stringifyFeedbackMeta(meta: FeedbackMeta): string {
  const compact: FeedbackMeta = {}
  for (const [key, value] of Object.entries(meta)) {
    const trimmed = typeof value === "string" ? value.trim() : value
    if (trimmed) {
      ;(compact as Record<string, unknown>)[key] = trimmed
    }
  }
  return `${META_PREFIX}${JSON.stringify(compact)}`
}

export function addHistoryEntry(meta: FeedbackMeta, action: string, actor?: string, changes?: Record<string, unknown>): FeedbackMeta {
  const history = meta.history || []
  return {
    ...meta,
    history: [...history, {
      timestamp: new Date().toISOString(),
      action,
      actor,
      changes,
    }],
  }
}