type TelegramAlertParams = {
  route: string
  message: string
  details?: string
  statusCode?: number
  actorId?: string | null
  actorEmail?: string | null
}

function truncate(value: string, max = 1200) {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

export async function sendTelegramErrorAlert(params: TelegramAlertParams) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return

  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"
  const lines = [
    "🚨 Erreur activite Milele",
    `Route: ${params.route}`,
    `Message: ${params.message}`,
    `HTTP: ${params.statusCode ?? "n/a"}`,
    `Env: ${environment}`,
    `Actor: ${params.actorEmail ?? "inconnu"} (${params.actorId ?? "n/a"})`,
  ]

  if (params.details) {
    lines.push(`Details: ${truncate(params.details)}`)
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
      }),
    })
  } catch {
    // No-op: never block the API response when Telegram is unavailable.
  }
}
