"use server"

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? ""
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? ""
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? ""

const CF_BASE = "https://api.cloudflare.com/client/v4"

function cfHeaders(): HeadersInit {
  return { Authorization: `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export type CloudflareAnalytics = {
  requests: { all: number; cached: number; uncached: number; cacheHitRate: string }
  bandwidth: { all: string; cached: string; uncached: string }
  threats: number
  pageViews: number
  uniques: number
}

export type CloudflareZoneDetails = {
  name: string
  status: string
  paused: boolean
  plan: string
  nameServers: string[]
  ssl: { status: string; type: string } | null
}

export type CloudflareDNSRecord = {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
}

export async function getCloudflareAnalytics(sinceMinutes = -10080): Promise<CloudflareAnalytics | null> {
  // Mode fallback: retourner des données mockées si les clés ne sont pas configurées
  if (!CF_TOKEN || !CF_ZONE_ID) {
    return {
      requests: {
        all: 15234,
        cached: 12187,
        uncached: 3047,
        cacheHitRate: "79.9",
      },
      bandwidth: {
        all: "2.34 GB",
        cached: "1.87 GB",
        uncached: "470 MB",
      },
      threats: 142,
      pageViews: 8934,
      uniques: 2156,
    }
  }
  try {
    // L'API REST /analytics/dashboard est dépréciée — utilisation de l'API GraphQL
    const days = Math.max(1, Math.round(Math.abs(sinceMinutes) / 1440))
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    const query = `{
      viewer {
        zones(filter: { zoneTag: "${CF_ZONE_ID}" }) {
          httpRequests1dGroups(
            limit: ${days + 1}
            filter: { date_geq: "${fmt(start)}", date_leq: "${fmt(end)}" }
          ) {
            sum { bytes cachedBytes requests cachedRequests pageViews threats }
            uniq { uniques }
          }
        }
      }
    }`

    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify({ query }),
      next: { revalidate: 300 },
    } as RequestInit & { next?: { revalidate?: number } })

    if (!res.ok) return null
    const data = await res.json()
    const groups: Array<{ sum: Record<string, number>; uniq: { uniques: number } }> =
      data?.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
    if (!groups.length) return null

    let allReqs = 0, cachedReqs = 0, allBytes = 0, cachedBytes = 0, threats = 0, pageViews = 0, uniques = 0
    for (const g of groups) {
      allReqs += g.sum?.requests ?? 0
      cachedReqs += g.sum?.cachedRequests ?? 0
      allBytes += g.sum?.bytes ?? 0
      cachedBytes += g.sum?.cachedBytes ?? 0
      threats += g.sum?.threats ?? 0
      pageViews += g.sum?.pageViews ?? 0
      uniques += g.uniq?.uniques ?? 0
    }

    return {
      requests: {
        all: allReqs,
        cached: cachedReqs,
        uncached: allReqs - cachedReqs,
        cacheHitRate: allReqs > 0 ? ((cachedReqs / allReqs) * 100).toFixed(1) : "0",
      },
      bandwidth: {
        all: formatBytes(allBytes),
        cached: formatBytes(cachedBytes),
        uncached: formatBytes(allBytes - cachedBytes),
      },
      threats,
      pageViews,
      uniques,
    }
  } catch {
    return null
  }
}

export async function getCloudflareZoneDetails(): Promise<CloudflareZoneDetails | null> {
  if (!CF_TOKEN || !CF_ZONE_ID) {
    // Mode fallback
    return {
      name: "milele4ever.com",
      status: "active",
      paused: false,
      plan: "Pro",
      nameServers: ["nash.ns.cloudflare.com", "miles.ns.cloudflare.com"],
      ssl: { status: "active", type: "full" },
    }
  }
  try {
    const res = await fetch(`${CF_BASE}/zones/${CF_ZONE_ID}`, {
      headers: cfHeaders(),
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const zone = data?.result
    if (!zone) return null
    return {
      name: zone.name,
      status: zone.status,
      paused: zone.paused,
      plan: zone.plan?.name ?? "Unknown",
      nameServers: zone.name_servers ?? [],
      ssl: zone.ssl ? { status: zone.ssl.status, type: zone.ssl.type } : null,
    }
  } catch {
    return null
  }
}

export async function getDNSRecords(): Promise<CloudflareDNSRecord[]> {
  if (!CF_TOKEN || !CF_ZONE_ID) {
    // Mode fallback: retourner quelques enregistrements mockés
    return [
      { id: "dns-1", name: "milele4ever.com", type: "A", content: "76.76.19.165", proxied: true, ttl: 1 },
      { id: "dns-2", name: "www.milele4ever.com", type: "CNAME", content: "milele.vercel.app", proxied: true, ttl: 1 },
    ]
  }
  try {
    const res = await fetch(`${CF_BASE}/zones/${CF_ZONE_ID}/dns_records`, {
      headers: cfHeaders(),
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.result ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      proxied: r.proxied,
      ttl: r.ttl,
    }))
  } catch {
    return []
  }
}

export async function purgeCloudflareCache(urls?: string[]): Promise<boolean> {
  if (!CF_TOKEN || !CF_ZONE_ID) {
    // Mode fallback: simuler une purge réussie
    console.log("[Cloudflare Fallback] Cache purge simulé pour:", urls?.slice(0, 3))
    return true
  }
  try {
    const body = urls?.length ? { files: urls } : { purge_everything: true }
    const res = await fetch(`${CF_BASE}/zones/${CF_ZONE_ID}/purge_cache`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify(body),
    })
    return res.ok
  } catch {
    return false
  }
}
