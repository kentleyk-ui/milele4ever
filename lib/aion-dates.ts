export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)

  if (secs < 60) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 30) return `Il y a ${days}j`
  if (months < 12) return `Il y a ${months} mois`
  return `Il y a ${Math.floor(days / 365)} an${days >= 730 ? "s" : ""}`
}

const MOIS = [
  "janvier","février","mars","avril","mai","juin",
  "juillet","août","septembre","octobre","novembre","décembre",
]

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
}
