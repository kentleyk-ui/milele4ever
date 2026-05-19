"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useDossier } from "@/lib/dossier-context"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import MemberAuth from "@/components/MemberAuth"
import {
  Users, UserPlus, Search, X, Check, Clock, Send,
  Mail, TreeDeciduous, ChevronDown, ChevronRight, Copy,
  Heart, Star, Handshake, AlertCircle,
} from "lucide-react"
import Link from "next/link"

/* ═══ Types ═══ */
type Category = "famille" | "amis" | "connaissances"
type ConnectionStatus = "accepted" | "pending" | "invited" | "declined"

interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  connectionStatus?: ConnectionStatus | null
}

interface Connection {
  id: string
  category: Category
  status: ConnectionStatus
  created_at: string
  target: Profile | null
  requester: Profile | null
}

interface ProgrammeSummary {
  ownerId: string
  displayName: string
  avatarUrl: string | null
  defuntName: string | null
  updatedAt: string
  excludedMemberIds?: string[]
  summary: {
    total: number
    completed: number
    byPhase: { "48h": number; "1semaine": number; "1mois": number }
    completedByPhase: { "48h": number; "1semaine": number; "1mois": number }
  }
}

/* ═══ Config catégories ═══ */
const CATEGORIES: Record<Category, {
  label: string
  description: string
  color: string
  bg: string
  icon: typeof Heart
  permissions: string[]
}> = {
  famille: {
    label: "Famille",
    description: "Accès maximal — informations étendues, publications privées, événements familiaux",
    color: "#a16207",
    bg: "oklch(96% 0.03 80)",
    icon: Heart,
    permissions: ["Informations personnelles étendues", "Publications privées", "Événements familiaux"],
  },
  amis: {
    label: "Amis",
    description: "Accès intermédiaire — publications semi-privées, statut, photo, bio",
    color: "#0369a1",
    bg: "oklch(96% 0.03 220)",
    icon: Star,
    permissions: ["Publications semi-privées", "Statut, photo, bio"],
  },
  connaissances: {
    label: "Connaissances",
    description: "Accès minimal — profil public et statut uniquement",
    color: "var(--primary)",
    bg: "oklch(96% 0.03 150)",
    icon: Handshake,
    permissions: ["Profil public", "Statut"],
  },
}

/* ═══ Avatar ═══ */
function Avatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={profile.display_name}
        width={size}
        height={size}
        loading="lazy"
        unoptimized
        className="rounded-full object-cover flex-shrink-0 transition-opacity duration-300"
        style={{ width: size, height: size }}
      />
    )
  }
  const initials = profile.display_name
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0 text-xs"
      style={{
        width: size,
        height: size,
        background: "var(--secondary)",
        color: "var(--primary)",
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  )
}

/* ═══ Badge catégorie ═══ */
function CategoryBadge({ category }: { category: Category }) {
  const cfg = CATEGORIES[category]
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

/* ═══ Modal invitation ═══ */
function InviteModal({
  profile,
  onClose,
  onSent,
  token,
}: {
  profile: Profile | null
  onClose: () => void
  onSent: () => void
  token: string
}) {
  const [category, setCategory] = useState<Category>("amis")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSend = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/membres/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId: profile?.id,
          category,
          message: message.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi")
        return
      }
      onSent()
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-3xl p-6"
        style={{ background: "var(--background)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Tête */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Ajouter à votre arbre
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Profil cible */}
        {profile && (
          <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl" style={{ background: "var(--card)" }}>
            <Avatar profile={profile} size={44} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{profile.display_name}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Membre Milele</p>
            </div>
          </div>
        )}

        {/* Choix de catégorie */}
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
          Ajouter en tant que
        </p>
        <div className="flex flex-col gap-2 mb-5">
          {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className="flex items-start gap-3 p-3 rounded-2xl text-left transition-all"
                style={{
                  background: category === key ? cfg.bg : "var(--card)",
                  border: `1.5px solid ${category === key ? cfg.color : "var(--border)"}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: category === key ? cfg.color : "var(--secondary)", color: category === key ? "white" : cfg.color }}
                >
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: category === key ? cfg.color : "var(--foreground)" }}>
                    {cfg.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{cfg.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Message optionnel */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            Message (optionnel)
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Bonjour, je vous ajoute à mon cercle Milele…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: "oklch(97% 0.02 30)", color: "#b91c1c" }}>
            <AlertCircle size={14} />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <div className="flex justify-center">
          <LiquidMetalButton
            label={loading ? "Envoi…" : "Envoyer la demande"}
            width={220}
            height={42}
            fontSize={13}
            tinted
            onClick={handleSend}
          />
        </div>
      </div>
    </div>
  )
}

/* ═══ Modal invitation externe ═══ */
function ExternalInviteModal({
  onClose,
  onSent,
  token,
}: {
  onClose: () => void
  onSent: () => void
  token: string
}) {
  const [category, setCategory] = useState<Category>("amis")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSend = async () => {
    if (!email.includes("@")) {
      setError("Veuillez saisir un email valide")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/membres/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetEmail: email.trim(),
          category,
          message: message.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erreur")
        return
      }
      if (data.invitationLink) {
        setInviteLink(data.invitationLink)
      } else {
        onSent()
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Après génération du lien, on confirme
  if (inviteLink) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-md rounded-3xl p-6"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: "oklch(95% 0.05 150)" }}>
              <TreeDeciduous size={26} style={{ color: "var(--primary)" }} />
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Lien d&apos;invitation créé
            </h3>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Partagez ce lien avec <strong>{email}</strong> pour qu&apos;il/elle rejoigne Milele et soit ajouté(e) automatiquement.
            </p>
          </div>
          <div
            className="flex items-center gap-2 p-3 rounded-2xl mb-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p className="flex-1 text-xs break-all" style={{ color: "var(--muted-foreground)" }}>{inviteLink}</p>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 transition-all"
              style={{
                background: copied ? "oklch(95% 0.05 150)" : "var(--secondary)",
                color: copied ? "var(--primary)" : "var(--foreground)",
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
          <div className="flex justify-center">
            <LiquidMetalButton label="Fermer" width={160} height={40} fontSize={13} onClick={() => { onSent(); onClose() }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-3xl p-6"
        style={{ background: "var(--background)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Inviter une personne
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="prénom.nom@email.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
          Catégorie
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all"
                style={{
                  background: category === key ? cfg.bg : "var(--card)",
                  border: `1.5px solid ${category === key ? cfg.color : "var(--border)"}`,
                }}
              >
                <Icon size={18} style={{ color: cfg.color }} />
                <span className="text-xs font-medium" style={{ color: category === key ? cfg.color : "var(--foreground)" }}>
                  {cfg.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            Message (optionnel)
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Je vous invite à rejoindre Milele…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: "oklch(97% 0.02 30)", color: "#b91c1c" }}>
            <AlertCircle size={14} />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <div className="flex justify-center">
          <LiquidMetalButton
            label={loading ? "Génération…" : "Générer le lien"}
            width={200}
            height={42}
            fontSize={13}
            tinted
            onClick={handleSend}
          />
        </div>
      </div>
    </div>
  )
}

/* ═══ Carte connexion ═══ */
function ConnectionCard({
  connection,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
}: {
  connection: Connection
  currentUserId: string
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
  onCancel?: (id: string) => void
}) {
  const isRequester = connection.requester?.id !== currentUserId
  const person = isRequester ? connection.requester : connection.target
  if (!person) return null

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:scale-[1.01]"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <Avatar profile={person} size={42} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
          {person.display_name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <CategoryBadge category={connection.category} />
          {connection.status === "pending" && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Clock size={10} />
              En attente
            </span>
          )}
          {connection.status === "invited" && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Send size={10} />
              Invitation email
            </span>
          )}
        </div>
      </div>
      {connection.status === "pending" && connection.target?.id === currentUserId && onAccept && onDecline && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onDecline(connection.id)}
            className="p-2 rounded-xl hover:opacity-70 transition-colors"
            style={{ background: "var(--secondary)", color: "#dc2626" }}
            title="Refuser"
          >
            <X size={14} />
          </button>
          <button
            onClick={() => onAccept(connection.id)}
            className="p-2 rounded-xl hover:opacity-70 transition-colors"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            title="Accepter"
          >
            <Check size={14} />
          </button>
        </div>
      )}
      {(connection.status === "pending" || connection.status === "invited") && connection.requester?.id === currentUserId && onCancel && (
        <button
          onClick={() => onCancel(connection.id)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-medium hover:opacity-80 transition-colors"
          style={{ background: "var(--secondary)", color: "#dc2626" }}
          title="Annuler la demande"
        >
          Annuler
        </button>
      )}
    </div>
  )
}

/* ═══ Page principale ═══ */
export default function MembresPage() {
  const { dossier, setMemberExclusion } = useDossier()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("inviteToken")?.trim() ?? ""
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [accessToken, setAccessToken] = useState("")
  const [loading, setLoading] = useState(true)

  const [connections, setConnections] = useState<{
    accepted: Connection[]
    pending: Connection[]
    sent: Connection[]
  }>({ accepted: [], pending: [], sent: [] })

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [inviteTarget, setInviteTarget] = useState<Profile | null>(null)
  const [showExternalInvite, setShowExternalInvite] = useState(false)

  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set(["famille", "amis", "connaissances"]))
  const [newRequestToast, setNewRequestToast] = useState<string | null>(null)
  const [tokenProcessed, setTokenProcessed] = useState(false)
  const [sharedProgrammes, setSharedProgrammes] = useState<ProgrammeSummary[]>([])

  // Auth
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" })
        setAccessToken(session.access_token)
      }
      setLoading(false)
    })()
  }, [])

  // Charger les connexions
  const loadConnections = useCallback(async () => {
    if (!accessToken) return
    const res = await fetch("/api/membres/accept", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setConnections(data)
    }
  }, [accessToken])

  const loadSharedProgrammes = useCallback(async () => {
    if (!accessToken) return
    const res = await fetch("/api/membres/programmes", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return
    const data = await res.json() as { programmes?: ProgrammeSummary[] }
    setSharedProgrammes(data.programmes ?? [])
  }, [accessToken])

  // Realtime — écouter les nouvelles demandes de connexion
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`connections:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connections",
          filter: `target_id=eq.${user.id}`,
        },
        async (payload) => {
          // Nouvelle demande reçue — recharger + afficher toast
          void loadConnections()
          // Récupérer le nom du demandeur
          const { data } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", payload.new.requester_id)
            .single()
          const name = data?.display_name ?? "Quelqu'un"
          setNewRequestToast(`${name} souhaite rejoindre votre cercle`)
          setTimeout(() => setNewRequestToast(null), 5000)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "connections",
          filter: `requester_id=eq.${user.id}`,
        },
        () => {
          // Une demande qu'on a envoyée a été traitée
          void loadConnections()
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user, loadConnections])

  useEffect(() => {
    void loadConnections()
    void loadSharedProgrammes()
  }, [loadConnections, loadSharedProgrammes])

  // Realtime des programmes partagés (broadcast depuis dossier-context)
  useEffect(() => {
    if (!user) return

    const acceptedIds = new Set<string>(connections.accepted.map((connection) =>
      connection.requester?.id === user.id ? connection.target?.id : connection.requester?.id
    ).filter(Boolean) as string[])

    const channel = supabase
      .channel("dossier-live")
      .on("broadcast", { event: "dossier-update" }, ({ payload }) => {
        const incoming = payload as ProgrammeSummary
        if (!incoming?.ownerId || !acceptedIds.has(incoming.ownerId)) return
        if ((incoming.excludedMemberIds ?? []).includes(user.id)) {
          setSharedProgrammes((prev) => prev.filter((item) => item.ownerId !== incoming.ownerId))
          return
        }
        setSharedProgrammes((prev) => {
          const idx = prev.findIndex((item) => item.ownerId === incoming.ownerId)
          if (idx === -1) return [...prev, incoming]
          const next = [...prev]
          next[idx] = { ...next[idx], ...incoming }
          return next
        })
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user, connections.accepted])

  // Si un token d'invitation est présent dans l'URL, l'accepter automatiquement
  useEffect(() => {
    if (!inviteToken || !accessToken || tokenProcessed) return

    void (async () => {
      const res = await fetch("/api/membres/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ invitationToken: inviteToken, action: "accept" }),
      })

      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        setNewRequestToast("Invitation acceptée. Vous avez rejoint le cercle.")
        setTimeout(() => setNewRequestToast(null), 5000)
        await loadConnections()
      } else {
        setNewRequestToast(payload.error ?? "Impossible d'accepter l'invitation.")
        setTimeout(() => setNewRequestToast(null), 5000)
      }
      setTokenProcessed(true)
    })()
  }, [inviteToken, accessToken, tokenProcessed, loadConnections])

  // Recherche
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !accessToken) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      const res = await fetch(`/api/membres/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results ?? [])
      }
      setSearchLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, accessToken])

  const handleAccept = async (connectionId: string) => {
    await fetch("/api/membres/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ connectionId, action: "accept" }),
    })
    void loadConnections()
  }

  const handleDecline = async (connectionId: string) => {
    await fetch("/api/membres/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ connectionId, action: "decline" }),
    })
    void loadConnections()
  }

  const handleCancel = async (connectionId: string) => {
    await fetch("/api/membres/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ connectionId, action: "cancel" }),
    })
    void loadConnections()
  }

  const toggleCategory = (cat: Category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Grouper les connexions acceptées par catégorie
  const byCategory = (Object.keys(CATEGORIES) as Category[]).map(cat => ({
    cat,
    items: connections.accepted.filter(c => c.category === cat),
  }))

  const getOtherMemberId = (connection: Connection) =>
    connection.requester?.id === user?.id ? connection.target?.id ?? null : connection.requester?.id ?? null

  const isExcluded = (memberId: string | null) => {
    if (!memberId || !dossier) return false
    return (dossier.excludedMemberIds ?? []).includes(memberId)
  }

  const totalAccepted = connections.accepted.length
  const [connSearch, setConnSearch] = useState("")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Chargement…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm">
          <MemberAuth
            onSuccess={() => {
              supabase.auth.getSession().then(({ data }) => {
                if (data.session?.user) {
                  setUser({ id: data.session.user.id, email: data.session.user.email ?? "" })
                  setAccessToken(data.session.access_token)
                }
              })
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto pb-24">

      {/* Toast realtime — nouvelle demande */}
      {newRequestToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all animate-in slide-in-from-bottom-4"
          style={{
            background: "var(--background)",
            border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            maxWidth: "min(90vw, 360px)",
          }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "var(--primary)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{newRequestToast}</p>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TreeDeciduous size={20} style={{ color: "var(--primary)" }} />
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
              Un arbre qui grandit
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {totalAccepted} membre{totalAccepted !== 1 ? "s" : ""} dans votre cercle
            {connections.pending.length > 0 && ` · ${connections.pending.length} demande${connections.pending.length > 1 ? "s" : ""} en attente`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <LiquidMetalButton
          label="Rechercher un membre"
          width={190}
          height={40}
          fontSize={12}
          tinted
          onClick={() => setShowSearch(!showSearch)}
          iconNode={<Search size={14} />}
        />
        <LiquidMetalButton
          label="Inviter par email"
          width={170}
          height={40}
          fontSize={12}
          onClick={() => setShowExternalInvite(true)}
          iconNode={<Mail size={14} />}
        />
      </div>

      {/* Barre de recherche */}
      {showSearch && (
        <div className="mb-6">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Search size={16} style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--foreground)" }}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]) }}>
                <X size={14} style={{ color: "var(--muted-foreground)" }} />
              </button>
            )}
          </div>

          {searchLoading && (
            <p className="text-xs px-2" style={{ color: "var(--muted-foreground)" }}>Recherche…</p>
          )}

          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {searchResults.map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <Avatar profile={profile} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{profile.display_name}</p>
                    {profile.connectionStatus && (
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {profile.connectionStatus === "accepted" ? "✓ Dans votre cercle" :
                          profile.connectionStatus === "pending" ? "⏳ Demande envoyée" : ""}
                      </p>
                    )}
                  </div>
                  {!profile.connectionStatus && (
                    <button
                      onClick={() => setInviteTarget(profile)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      <UserPlus size={12} />
                      Ajouter
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <div className="p-4 rounded-2xl text-center" style={{ background: "var(--card)" }}>
              <p className="text-sm mb-1" style={{ color: "var(--foreground)" }}>Aucun membre trouvé</p>
              <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                Cette personne n&apos;a pas encore de compte Milele.
              </p>
              <button
                onClick={() => { setShowExternalInvite(true); setShowSearch(false) }}
                className="text-xs font-medium underline"
                style={{ color: "var(--primary)" }}
              >
                Envoyer une invitation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Demandes reçues */}
      {connections.pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "#b45309" }}>
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
              style={{ background: "#fef3c7", color: "#b45309" }}
            >
              {connections.pending.length}
            </span>
            Demandes reçues
          </h2>
          <div className="flex flex-col gap-2">
            {connections.pending.map(c => (
              <ConnectionCard
                key={c.id}
                connection={c}
                currentUserId={user.id}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Demandes envoyées en attente */}
      {connections.sent.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <Clock size={13} />
            Envoyées · en attente
          </h2>
          <div className="flex flex-col gap-2">
            {connections.sent.map(c => (
              <ConnectionCard key={c.id} connection={c} currentUserId={user.id} onCancel={handleCancel} />
            ))}
          </div>
        </div>
      )}

      {/* Programmes partagés en temps réel */}
      {sharedProgrammes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <Users size={13} />
            Programmes de vos membres
          </h2>
          <div className="flex flex-col gap-2">
            {sharedProgrammes
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((programme) => (
                <div key={programme.ownerId} className="rounded-2xl p-3.5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar profile={{ id: programme.ownerId, display_name: programme.displayName, avatar_url: programme.avatarUrl }} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{programme.displayName}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {programme.defuntName ? `Dossier : ${programme.defuntName}` : "Dossier Milele"} · Mis à jour {new Date(programme.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl py-2" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                      <div className="font-semibold">48h</div>
                      <div>{programme.summary.completedByPhase["48h"]}/{programme.summary.byPhase["48h"]}</div>
                    </div>
                    <div className="rounded-xl py-2" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                      <div className="font-semibold">1 semaine</div>
                      <div>{programme.summary.completedByPhase["1semaine"]}/{programme.summary.byPhase["1semaine"]}</div>
                    </div>
                    <div className="rounded-xl py-2" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                      <div className="font-semibold">1 mois</div>
                      <div>{programme.summary.completedByPhase["1mois"]}/{programme.summary.byPhase["1mois"]}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Avancement global : {programme.summary.completed}/{programme.summary.total}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Arbre — connexions par catégorie */}
      {totalAccepted > 0 ? (
        <div className="flex flex-col gap-4">
          {/* Barre de filtre connexions */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Search size={14} style={{ color: "var(--muted-foreground)" }} />
            <input type="text" value={connSearch} onChange={e => setConnSearch(e.target.value)}
              placeholder="Filtrer mes connexions…" className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--foreground)" }} />
            {connSearch && (
              <button onClick={() => setConnSearch("")}><X size={13} style={{ color: "var(--muted-foreground)" }} /></button>
            )}
          </div>
          {byCategory.filter(g => {
            if (!connSearch.trim()) return g.items.length > 0
            const q = connSearch.toLowerCase()
            return g.items.some(c => {
              const other = c.requester?.id === user?.id ? c.target : c.requester
              return other?.display_name?.toLowerCase().includes(q)
            })
          }).map(({ cat, items }) => {
            const filteredItems = connSearch.trim()
              ? items.filter(c => {
                  const other = c.requester?.id === user?.id ? c.target : c.requester
                  return other?.display_name?.toLowerCase().includes(connSearch.toLowerCase())
                })
              : items
            const cfg = CATEGORIES[cat]
            const Icon = cfg.icon
            const expanded = expandedCategories.has(cat)

            return (
              <div key={cat} className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {/* En-tête catégorie */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-3 px-5 py-4 transition-colors hover:opacity-80"
                  style={{ background: cfg.bg }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.color, color: "white" }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {filteredItems.length} membre{filteredItems.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  {expanded ? <ChevronDown size={16} style={{ color: cfg.color }} /> : <ChevronRight size={16} style={{ color: cfg.color }} />}
                </button>

                {/* Liste */}
                {expanded && (
                  <div className="flex flex-col divide-y" style={{ borderTop: "1px solid var(--border)" }}>
                    {filteredItems.map(c => {
                      const otherId = getOtherMemberId(c)
                      const excluded = isExcluded(otherId)
                      return (
                      <div key={c.id} className="px-4 py-3">
                        <ConnectionCard connection={c} currentUserId={user.id} />
                        {otherId && (
                          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              Consultation du dossier partagé
                            </p>
                            <button
                              onClick={() => setMemberExclusion(otherId, !excluded)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                              style={{
                                background: excluded ? "oklch(96% 0.03 160)" : "oklch(96% 0.03 30)",
                                color: excluded ? "#065f46" : "#b91c1c",
                                border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                              }}
                              title="Le propriétaire peut exclure ce membre même s'il est dans le bon groupe"
                            >
                              {excluded ? "Autoriser" : "Exclure"}
                            </button>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* État vide */
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "var(--secondary)" }}>
            <TreeDeciduous size={28} style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Votre arbre attend ses premières branches
          </h3>
          <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Recherchez des membres Milele ou invitez vos proches pour construire votre cercle de confiance.
          </p>
        </div>
      )}

      {/* Modals */}
      {inviteTarget && (
        <InviteModal
          profile={inviteTarget}
          token={accessToken}
          onClose={() => setInviteTarget(null)}
          onSent={() => { setInviteTarget(null); void loadConnections() }}
        />
      )}
      {showExternalInvite && (
        <ExternalInviteModal
          token={accessToken}
          onClose={() => setShowExternalInvite(false)}
          onSent={() => { setShowExternalInvite(false); void loadConnections() }}
        />
      )}
    </div>
  )
}
