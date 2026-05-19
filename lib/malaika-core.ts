export type MalaikaScope = "staff" | "public"

export type MalaikaPermissions = {
  canAccessInternalData: boolean
  canManageTickets: boolean
  canManageStaff: boolean
  canRunAdminActions: boolean
  canAccessLogs: boolean
  canUseAdvancedTools: boolean
}

export type MalaikaBehavior = {
  tone: "professional" | "empathetic"
  style: "technical" | "human"
}

export type MalaikaProfile = {
  scope: MalaikaScope
  label: string
  permissions: MalaikaPermissions
  behavior: MalaikaBehavior
}

export const MALAIKA_STAFF_PROFILE: MalaikaProfile = {
  scope: "staff",
  label: "Malaika Staff",
  permissions: {
    canAccessInternalData: true,
    canManageTickets: true,
    canManageStaff: true,
    canRunAdminActions: true,
    canAccessLogs: true,
    canUseAdvancedTools: true,
  },
  behavior: {
    tone: "professional",
    style: "technical",
  },
}

export const MALAIKA_PUBLIC_PROFILE: MalaikaProfile = {
  scope: "public",
  label: "Malaika Public",
  permissions: {
    canAccessInternalData: false,
    canManageTickets: false,
    canManageStaff: false,
    canRunAdminActions: false,
    canAccessLogs: false,
    canUseAdvancedTools: false,
  },
  behavior: {
    tone: "empathetic",
    style: "human",
  },
}

const INTERNAL_KEYWORDS = [
  "ticket",
  "staff",
  "admin",
  "log",
  "logs",
  "base de donnees",
  "database",
  "supabase",
  "permissions staff",
  "role staff",
  "outil interne",
]

export function isInternalRequest(message: string) {
  const normalized = message.toLowerCase()
  return INTERNAL_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

type ReplyHistoryItem = {
  role: "user" | "assistant"
  content: string
}

type BuildReplyOptions = {
  memoryEnabled: boolean
  history?: ReplyHistoryItem[]
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

function asksIdentity(message: string) {
  const lower = normalizeText(message)
  return (
    lower.includes("qui es tu") ||
    lower.includes("ton nom") ||
    lower.includes("comment tu t appelles") ||
    lower.includes("qui t a cree") ||
    lower.includes("createur") ||
    lower.includes("que veut dire malaika")
  )
}

function getContextualTopic(message: string): string {
  const lower = normalizeText(message)
  if (lower.includes("profil") || lower.includes("compte") || lower.includes("édition") || lower.includes("bio") || lower.includes("avatar")) return "profile"
  if (lower.includes("publication") || lower.includes("post") || lower.includes("partag") || lower.includes("publier") || lower.includes("photo") || lower.includes("vidéo")) return "publication"
  if (lower.includes("service") || lower.includes("prestataire") || lower.includes("geoloc") || lower.includes("geolocation") || lower.includes("position") || lower.includes("annuaire")) return "services"
  if (lower.includes("dossier") || lower.includes("enfant") || lower.includes("animal") || lower.includes("sous-compte")) return "dossier"
  if (lower.includes("contact") || lower.includes("conversation") || lower.includes("connection") || lower.includes("rejoindre")) return "contact"
  if (lower.includes("aide") || lower.includes("comment faire") || lower.includes("tu peux") || lower.includes("expliqu")) return "help"
  if (lower.includes("navigat") || lower.includes("page") || lower.includes("espace") || lower.includes("menu")) return "navigation"
  if (lower.includes("erreur") || lower.includes("problème") || lower.includes("ça marche pas") || lower.includes("bug") || lower.includes("fonctionne pas")) return "support"
  return "general"
}

function pickNonRepeatingReply(candidates: string[], history: ReplyHistoryItem[] | undefined): string {
  const lastAssistant = history
    ?.slice()
    .reverse()
    .find((item) => item.role === "assistant")
    ?.content
    ?.trim()

  if (!lastAssistant) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  const filtered = candidates.filter((candidate) => candidate.trim() !== lastAssistant)
  if (filtered.length === 0) return candidates[0]
  return filtered[Math.floor(Math.random() * filtered.length)]
}

function generateContextualReply(message: string, topic: string, options: BuildReplyOptions): string {
  const shouldIntroduce = asksIdentity(message)
  const replies: Record<string, string[]> = {
    profile: [
      "Super ! Je t'aide à perfectionner ton profil. Tu peux ajouter une photo, éditer ta bio, gérer tes sous-comptes enfant/animal avec leurs droits spécifiques. Dis-moi ce que tu veux modifier.",
      "Ton profil est ton identité sur Milele ! Je peux t'aider à le personnaliser, gérer tes publications, ou configurer ta visibilité. C'est quoi ton besoin ?",
      "J'adore quand tu veux améliorer ton profil ! On peut explorer tes publications, ajouter des sous-comptes, ou affiner tes préférences. Par où tu commences ?",
    ],
    publication: [
      "Partager c'est relier les cœurs ! 💫 Je peux t'aider à créer une publication, ajouter des photos/vidéos, ou gérer tes posts existants. Qu'est-ce que tu veux partager ?",
      "Les publications sont ton voix sur Milele ! Tu peux poster en tant que toi ou via un sous-compte. Besoin de conseils pour bien commencer ?",
      "Super envie de créer ! Je t'aide à composer ta publication, gérer l'audience, ou choisir qui peut commenter. On y va ?",
    ],
    services: [
      "Parfait. Pour accéder aux Services: ouvre le menu principal puis va sur Services, choisis une catégorie et appuie sur Utiliser ma position pour voir les prestataires proches.",
      "Oui, je te guide: va dans Services, sélectionne le type de prestataire, puis active Utiliser ma position pour obtenir les résultats autour de toi.",
      "Top, on le fait ensemble: menu > Services, choisis ta catégorie, active Utiliser ma position, ensuite la liste des prestataires se met à jour automatiquement.",
    ],
    contact: [
      "Les contacts c'est la base du lien ! Je peux t'aider à trouver quelqu'un, lancer une conversation, ou organiser tes connexions. Qui cherches-tu ?",
      "Chaque contact compte. Je t'aide à créer des liens authentiques sur Milele. Besoin de trouver ou rejoindre quelqu'un ?",
      "La connexion humaine est au cœur de Milele. Je peux t'aider à explorer les contacts ou lancer une conversation. C'est quoi ton intention ?",
    ],
    dossier: [
      "Les dossiers enfant/animal sont une belle façon de documenter leurs vies ! 📚 Je peux t'aider à les créer, gérer leurs droits (publications, commentaires), ou voir leurs contributions. On fait quoi ?",
      "Tes enfants et animaux méritent leur propre espace sécurisé ! Je gère les droits de publication, les permissions, et la visibilité. Tu veux en créer un ?",
      "Super idée de créer des sous-comptes pour tes proches ! Je t'aide à les configurer avec les bonnes protections mineurs et permissions. C'est pour qui ?",
    ],
    help: [
      "Je suis là pour ça ! 🌟 Je peux t'expliquer n'importe quelle fonctionnalité de Milele, te guider pas à pas, ou trouver des solutions. Qu'est-ce qui te pose question ?",
      "Excellente question ! J'adore expliquer comment faire. Dis-moi exactement ce que tu veux accomplir et je vais te montrer le chemin.",
      "Pas de question bête sur Milele ! Je suis ton guide. Qu'est-ce que tu aimerais apprendre à faire ?",
    ],
    navigation: [
      "La navigation facile, c'est mon domain ! 🗺️ Je peux t'aider à explorer l'espace, trouver les menus, ou aller d'un endroit à l'autre. Où tu veux aller ?",
      "Perdu ou juste curieux ? Je connais chaque coin de Milele. Je te guide vers où tu dois aller ?",
      "La structure de Milele est pensée pour toi. Dis-moi où tu veux aller et je t'indique la meilleure route !",
    ],
    support: [
      "Ah, un souci ? Je déteste ça ! 🛠️ Décris-moi le problème précisément et on va le résoudre ensemble. C'est quoi le problème exact ?",
      "Les erreurs ça existe, mais je suis là pour les chasser ! Raconte-moi ce qui se passe et on va fixer ça.",
      "Un truc qui marche pas ? Zéro stress, je suis spécialisée en solutions. Donne-moi les détails et on se débarrasse du bug !",
    ],
    general: [
      "Je suis là pour t'aider tout de suite. Dis-moi l'action exacte que tu veux faire sur Milele et je te guide pas à pas.",
      "On avance ensemble. Donne-moi ton objectif précis sur Milele et je t'envoie le chemin le plus rapide.",
      "Parfait, je te suis. Dis-moi ce que tu veux accomplir maintenant et je te donne les étapes concrètes.",
    ],
    identity: [
      "Je suis Malaïka, assistante Milele. Mon nom signifie ange en swahili, et j'ai été créée par Kent Ley pour t'accompagner sur la plateforme.",
      "Je m'appelle Malaïka. En swahili, Malaïka veut dire ange, et j'ai été créée par Kent Ley pour guider les utilisateurs de Milele.",
      "Malaïka, c'est moi. Mon nom signifie ange en swahili, et Kent Ley m'a créée pour aider sur Milele avec chaleur et clarté.",
    ],
  }

  const selectedTopic = shouldIntroduce ? "identity" : topic
  const topicReplies = replies[selectedTopic] || replies.general
  const baseReply = pickNonRepeatingReply(topicReplies, options.history)

  return baseReply
}

export function buildPublicMalaikaReply(message: string, options: BuildReplyOptions) {
  const topic = getContextualTopic(message)
  return generateContextualReply(message, topic, options)
}
