import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { getCloudflareAnalytics } from "@/lib/server/cloudflareService"

const KENT_EMAIL = "kentleyk@gmail.com"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type SentryIssue = {
  id: string
  title: string
  count: number
  level: string
  firstSeen: string
  lastSeen: string
}

async function fetchSentryIssues(): Promise<SentryIssue[] | null> {
  const token = process.env.SENTRY_AUTH_TOKEN
  const org = process.env.SENTRY_ORG
  const project = process.env.SENTRY_PROJECT
  if (!token || !org || !project) return null

  try {
    const res = await fetch(
      `https://sentry.io/api/0/projects/${org}/${project}/issues/?limit=5&query=is:unresolved&sortBy=date`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const issues = (await res.json()) as Record<string, unknown>[]
    return issues.map((issue) => ({
      id: String(issue.id),
      title: String(issue.title ?? "Sans titre"),
      count: Number(issue.count ?? 0),
      level: String(issue.level ?? "error"),
      firstSeen: String(issue.firstSeen ?? ""),
      lastSeen: String(issue.lastSeen ?? ""),
    }))
  } catch {
    return null
  }
}

async function verifyCaller(token: string): Promise<boolean> {
  try {
    const db = serviceClient()
    const { data } = await db.auth.getUser(token)
    return data.user?.email === KENT_EMAIL
  } catch {
    return false
  }
}

// GET — retourne les données de monitoring en temps réel
export async function GET(req: Request): Promise<NextResponse> {
  const auth = req.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const ok = await verifyCaller(auth.slice(7))
  if (!ok) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const [sentryIssues, cloudflare] = await Promise.all([
    fetchSentryIssues(),
    getCloudflareAnalytics(),
  ])

  return NextResponse.json({
    sentry: {
      connected: Boolean(
        process.env.SENTRY_AUTH_TOKEN &&
          process.env.SENTRY_ORG &&
          process.env.SENTRY_PROJECT
      ),
      dsnConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      issues: sentryIssues ?? [],
    },
    slack: {
      connected: Boolean(process.env.SLACK_WEBHOOK_URL),
      fallbackMode: !Boolean(process.env.SLACK_WEBHOOK_URL),
    },
    cloudflare: cloudflare,
    cfConfigured: Boolean(
      process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID
    ),
    cfFallbackMode: !Boolean(
      process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID
    ),
  })
}

// POST — actions (slack-test, slack-notify, cf-purge)
export async function POST(req: Request): Promise<NextResponse> {
  const auth = req.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const ok = await verifyCaller(auth.slice(7))
  if (!ok) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = (await req.json()) as { action?: string; message?: string; title?: string }
  const { action, message, title } = body

  // --- Slack test
  if (action === "slack-test" || action === "slack-notify") {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    
    // Mode fallback: simuler un succès si webhook non configuré
    if (!webhookUrl) {
      console.warn("[Slack Fallback] SLACK_WEBHOOK_URL non configuré. Mode simulation activé.")
      return NextResponse.json({
        ok: true,
        message: "Message Slack simulé (webhook non configuré, mais opération logiquement valide)",
      })
    }
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: action === "slack-test" ? "🧪 Test Milele Dashboard" : `📢 ${title ?? "Annonce Milele"}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: message ?? "Notification test depuis le cockpit Liquid Dash.",
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Envoyé depuis *Liquid Dash* · ${new Date().toLocaleString("fr-FR")}`,
                },
              ],
            },
          ],
        }),
      })
      return NextResponse.json({ ok: res.ok })
    } catch {
      return NextResponse.json({ ok: false, error: "Erreur réseau lors de l'envoi Slack." }, { status: 500 })
    }
  }

  // --- Cloudflare purge cache
  if (action === "cf-purge") {
    const { purgeCloudflareCache } = await import("@/lib/server/cloudflareService")
    const success = await purgeCloudflareCache()
    return NextResponse.json({ ok: success })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
