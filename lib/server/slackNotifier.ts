const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export type SlackBlock =
  | { type: "header"; text: { type: "plain_text"; text: string } }
  | { type: "section"; text: { type: "mrkdwn"; text: string } }
  | { type: "context"; elements: Array<{ type: "mrkdwn"; text: string }> }
  | { type: "divider" }

export async function sendSlackMessage(blocks: SlackBlock[]): Promise<boolean> {
  if (!WEBHOOK_URL) return false
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function notifyNewFeedback(feedback: {
  id: string
  type: string
  message: string
  status: string
}): Promise<boolean> {
  return sendSlackMessage([
    { type: "header", text: { type: "plain_text", text: "🆕 Nouveau Feedback Milele" } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Catégorie:* ${feedback.type}\n*Statut:* ${feedback.status}\n*Message:* ${feedback.message}`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `Voir dans le dashboard → https://www.milele4ever.com/staff/liquid-dash` }],
    },
  ])
}

export async function notifyCriticalTicket(ticket: {
  id: string
  title: string
  status: string
  reporterName?: string
}): Promise<boolean> {
  return sendSlackMessage([
    { type: "header", text: { type: "plain_text", text: "🚨 Ticket critique Milele" } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Titre:* ${ticket.title}\n*Statut:* ${ticket.status}\n*Rapporteur:* ${ticket.reporterName ?? "Anonyme"}`,
      },
    },
    { type: "divider" },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `Envoyé depuis *Liquid Dash* · ${new Date().toLocaleString("fr-FR")}` }],
    },
  ])
}

export async function sendBroadcast(title: string, message: string): Promise<boolean> {
  return sendSlackMessage([
    { type: "header", text: { type: "plain_text", text: `📢 ${title}` } },
    { type: "section", text: { type: "mrkdwn", text: message } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `Envoyé depuis *Liquid Dash* · ${new Date().toLocaleString("fr-FR")}` }],
    },
  ])
}
