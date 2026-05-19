"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { X, Users, UserPlus, Trash2, ChevronDown, BookUser, Facebook, Linkedin, Instagram, Share2, CheckCircle2, AlertCircle, ChevronRight, Search } from "lucide-react"
import { useCircle } from "@/hooks/useCircle"
import EmptyState from "@/components/aion/EmptyState"
import GenealogyManager from "@/components/aion/GenealogyManager"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { supabase } from "@/lib/supabaseClient"
import { VISIBILITY_TIERS } from "@/types/aion"
import type { VisibilityLevel } from "@/types/aion"

interface NativeContact { name?: string[]; email?: string[] }
interface ContactSuggestion { name: string; email: string }
interface MileleMemberResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  connectionStatus: "pending" | "accepted" | "declined" | "invited" | "cancelled" | null
}
interface OutgoingConnection {
  id: string
  target_id: string | null
  status: "pending" | "accepted" | "declined" | "invited" | "cancelled"
  created_at: string
}

const ROLE_CONFIG = {
  member:   { label: "Membre",    desc: "Accès en lecture selon son niveau", color: "#3B82F6" },
  executor: { label: "Exécuteur", desc: "Peut gérer l'héritage",            color: "#F59E0B" },
  guardian: { label: "Gardien",   desc: "Responsable de la transmission",   color: "#8B5CF6" },
}

const SOCIAL_NETWORKS = [
  { id: "facebook",  label: "Facebook",  Icon: Facebook,  color: "#1877F2", desc: "Importer vos amis Facebook" },
  { id: "linkedin",  label: "LinkedIn",  Icon: Linkedin,  color: "#0A66C2", desc: "Importer vos contacts professionnels" },
  { id: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C", desc: "Importer depuis vos abonnés" },
]

export default function CerclePage() {
  const { members, activeMembers, loading, inviteMember, removeMember } = useCircle()

  // Formulaire
  const [showForm, setShowForm]               = useState(false)
  const [email, setEmail]                     = useState("")
  const [displayName, setDisplayName]         = useState("")
  const [visibilityLevel, setVisibilityLevel] = useState<VisibilityLevel>("famille")
  const [role, setRole]                       = useState<"member" | "executor" | "guardian">("member")
  const [saving, setSaving]                   = useState(false)
  const [expandedLevel, setExpandedLevel]     = useState<VisibilityLevel | null>(null)
  const [circleFilter, setCircleFilter]       = useState<"all" | "active" | "pending" | "former">("all")
  const [circleSearch, setCircleSearch]       = useState("")

  // Contacts
  const [contactsState, setContactsState]   = useState<"idle" | "requesting" | "granted" | "denied" | "unavailable">("idle")
  const [suggestions, setSuggestions]       = useState<ContactSuggestion[]>([])
  const [showContactsPanel, setShowContactsPanel] = useState(false)

  // Réseaux sociaux
  const [showSocialPanel, setShowSocialPanel]   = useState(false)
  const [connectedSocials, setConnectedSocials] = useState<string[]>([])
  const [socialConnecting, setSocialConnecting] = useState<string | null>(null)

  // Membres Milele
  const [showMemberSearch, setShowMemberSearch] = useState(false)
  const [memberQuery, setMemberQuery] = useState("")
  const [memberSearching, setMemberSearching] = useState(false)
  const [memberResults, setMemberResults] = useState<MileleMemberResult[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingConnection[]>([])
  const [sendingToMemberId, setSendingToMemberId] = useState<string | null>(null)
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null)

  const contactsApiAvailable = typeof window !== "undefined" && "contacts" in navigator && "ContactsManager" in window

  const loadOutgoingRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("connections")
      .select("id, target_id, status, created_at")
      .eq("requester_id", user.id)
      .in("status", ["pending", "invited"])
      .order("created_at", { ascending: false })

    setOutgoingRequests((data as OutgoingConnection[]) ?? [])
  }, [])

  useEffect(() => {
    void loadOutgoingRequests()
  }, [loadOutgoingRequests])

  const searchMileleMembers = useCallback(async () => {
    if (memberQuery.trim().length < 2) {
      setMemberResults([])
      return
    }
    setMemberSearching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setMemberResults([])
        setMemberSearching(false)
        return
      }

      const res = await fetch(`/api/membres/search?q=${encodeURIComponent(memberQuery.trim())}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      setMemberResults((json.results ?? []) as MileleMemberResult[])
    } catch {
      setMemberResults([])
    } finally {
      setMemberSearching(false)
    }
  }, [memberQuery])

  const sendMemberRequest = useCallback(async (targetId: string) => {
    setSendingToMemberId(targetId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch("/api/membres/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetId, category: "famille" }),
      })

      if (res.ok) {
        await loadOutgoingRequests()
        setMemberResults((prev) => prev.map((r) => r.id === targetId ? { ...r, connectionStatus: "pending" } : r))
      }
    } finally {
      setSendingToMemberId(null)
    }
  }, [loadOutgoingRequests])

  const cancelMemberRequest = useCallback(async (targetId: string) => {
    const req = outgoingRequests.find((r) => r.target_id === targetId)
    if (!req) return
    setCancellingRequestId(req.id)
    try {
      await supabase
        .from("connections")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", req.id)
      await loadOutgoingRequests()
      setMemberResults((prev) => prev.map((r) => r.id === targetId ? { ...r, connectionStatus: null } : r))
    } finally {
      setCancellingRequestId(null)
    }
  }, [loadOutgoingRequests, outgoingRequests])

  const filteredCircleMembers = useMemo(() => {
    if (circleFilter === "active") return members.filter((m) => m.status === "active")
    if (circleFilter === "pending") return members.filter((m) => m.status === "pending")
    if (circleFilter === "former") return members.filter((m) => m.status === "declined" || m.status === "removed")
    return members.filter((m) => m.status !== "removed")
  }, [circleFilter, members])

  const filteredMembersByLevel = useMemo(() => {
    const base = circleSearch.trim()
      ? filteredCircleMembers.filter(m =>
          (m.display_name ?? m.email).toLowerCase().includes(circleSearch.toLowerCase())
        )
      : filteredCircleMembers
    return {
      intime: base.filter((m) => m.visibility_level === "intime"),
      famille: base.filter((m) => m.visibility_level === "famille"),
      amis: base.filter((m) => m.visibility_level === "amis"),
      public: base.filter((m) => m.visibility_level === "public"),
    }
  }, [filteredCircleMembers, circleSearch])

  const genealogyMembers = useMemo(
    () => members
      .filter((member) => member.status !== "removed")
      .map((member) => ({
        id: member.id,
        display_name: member.display_name,
        email: member.email,
      })),
    [members]
  )

  // ── Demande accès carnet d'adresses ──────────────────────
  const requestContacts = useCallback(async () => {
    if (!contactsApiAvailable) {
      setContactsState("unavailable")
      setShowContactsPanel(true)
      return
    }
    setContactsState("requesting")
    try {
      // @ts-expect-error - Contacts API non encore dans les types TS standard
      const contacts: NativeContact[] = await navigator.contacts.select(["name", "email"], { multiple: true })
      const parsed: ContactSuggestion[] = contacts
        .flatMap((c) =>
          (c.email ?? []).map((em) => ({ name: c.name?.[0] ?? "", email: em }))
        )
        .filter((c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))
      setSuggestions(parsed)
      setContactsState("granted")
      setShowContactsPanel(true)
    } catch {
      setContactsState("denied")
      setShowContactsPanel(true)
    }
  }, [contactsApiAvailable])

  // ── Connexion réseau social (simulation OAuth) ────────────
  const connectSocial = async (id: string) => {
    setSocialConnecting(id)
    await new Promise(r => setTimeout(r, 1500))
    setConnectedSocials(prev => [...prev, id])
    setSocialConnecting(null)
    // Suggestions simulées (en prod: résultat de l'API OAuth)
    const mock: ContactSuggestion[] = [
      { name: "Marie Dupont",   email: "marie.dupont@gmail.com"  },
      { name: "Jean Martin",    email: "jean.martin@outlook.com" },
      { name: "Sophie Laurent", email: "sophie.l@yahoo.com"      },
    ]
    setSuggestions(prev => {
      const existing = new Set(prev.map(p => p.email))
      return [...prev, ...mock.filter(m => !existing.has(m.email))]
    })
    setShowSocialPanel(false)
    setShowContactsPanel(true)
  }

  // ── Remplir le formulaire depuis une suggestion ───────────
  const applySuggestion = (s: ContactSuggestion) => {
    setDisplayName(s.name)
    setEmail(s.email)
    setShowContactsPanel(false)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetForm = () => {
    setEmail(""); setDisplayName(""); setVisibilityLevel("famille"); setRole("member"); setShowForm(false)
  }
  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setSaving(true)
    await inviteMember(email, displayName, visibilityLevel, role)
    setSaving(false)
    resetForm()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
    </div>
  )

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--secondary)" }}>
            <Users size={20} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Mon Cercle</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {activeMembers.length} membre{activeMembers.length !== 1 ? "s" : ""} de confiance
            </p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}>
            <UserPlus size={16} /><span className="hidden sm:inline">Inviter</span>
          </button>
        )}
      </div>

      {/* ── Bandeaux Import contacts + Réseaux sociaux ── */}
      {!showContactsPanel && !showForm && (
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <button onClick={requestContacts}
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] touch-manipulation"
            style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 15%, var(--card))" }}>
              <BookUser size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Carnet d&apos;adresses</p>
              <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>Importer depuis vos contacts</p>
            </div>
            <ChevronRight size={16} className="ml-auto flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
          </button>

          <button onClick={() => setShowSocialPanel(true)}
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] touch-manipulation"
            style={{ background: "color-mix(in srgb, #8B5CF6 8%, var(--card))", border: "1px solid color-mix(in srgb, #8B5CF6 20%, var(--border))" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, #8B5CF6 15%, var(--card))" }}>
              <Share2 size={18} style={{ color: "#8B5CF6" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Réseaux sociaux</p>
              <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>
                {connectedSocials.length > 0
                  ? `${connectedSocials.length} réseau${connectedSocials.length > 1 ? "x" : ""} connecté${connectedSocials.length > 1 ? "s" : ""}`
                  : "Connecter pour plus de contacts"}
              </p>
            </div>
            <ChevronRight size={16} className="ml-auto flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
          </button>

          <button onClick={() => setShowMemberSearch(true)}
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] touch-manipulation"
            style={{ background: "color-mix(in srgb, #0EA5E9 8%, var(--card))", border: "1px solid color-mix(in srgb, #0EA5E9 20%, var(--border))" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, #0EA5E9 16%, var(--card))" }}>
              <Search size={18} style={{ color: "#0EA5E9" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Membres Milele</p>
              <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>
                Rechercher, demander, annuler
              </p>
            </div>
            <ChevronRight size={16} className="ml-auto flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      )}

      {/* Demandes envoyées */}
      {outgoingRequests.length > 0 && !showForm && (
        <div className="mb-5 p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, #0EA5E9 20%, var(--border))" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#0EA5E9" }}>
            {outgoingRequests.length} demande{outgoingRequests.length > 1 ? "s" : ""} envoyée{outgoingRequests.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Vous pouvez annuler une demande en cours à tout moment depuis la recherche membre.
          </p>
        </div>
      )}

      {/* Filtres intelligents */}
      {!showForm && (
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tous", count: members.filter((m) => m.status !== "removed").length },
            { key: "active", label: "Actifs", count: members.filter((m) => m.status === "active").length },
            { key: "pending", label: "En attente", count: members.filter((m) => m.status === "pending").length },
            { key: "former", label: "Anciens", count: members.filter((m) => m.status === "declined" || m.status === "removed").length },
          ].map((f) => {
            const selected = circleFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setCircleFilter(f.key as "all" | "active" | "pending" | "former")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-manipulation"
                style={{
                  background: selected ? "color-mix(in srgb, var(--primary) 16%, var(--card))" : "var(--card)",
                  color: selected ? "var(--primary)" : "var(--muted-foreground)",
                  border: `1px solid ${selected ? "color-mix(in srgb, var(--primary) 30%, var(--border))" : "var(--border)"}`,
                }}
              >
                {f.label} ({f.count})
              </button>
            )
          })}
        </div>
      )}

      {/* ── Panel contacts / suggestions ── */}
      <>
        {showContactsPanel && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-5 rounded-2xl overflow-hidden"
            style={{ border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))" }}>
              <div className="flex items-center gap-2">
                <BookUser size={16} style={{ color: "var(--primary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {suggestions.length > 0
                    ? `${suggestions.length} contact${suggestions.length !== 1 ? "s" : ""} trouvé${suggestions.length !== 1 ? "s" : ""}`
                    : "Accès aux contacts"}
                </span>
              </div>
              <button onClick={() => setShowContactsPanel(false)} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}>
                <X size={15} />
              </button>
            </div>

            {/* Permission refusée / API indisponible */}
            {(contactsState === "denied" || contactsState === "unavailable") && suggestions.length === 0 && (
              <div className="px-4 py-5 text-center">
                <AlertCircle size={28} className="mx-auto mb-2" style={{ color: "#F59E0B" }} />
                <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                  {contactsState === "unavailable" ? "Contacts non disponibles" : "Accès refusé"}
                </p>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {contactsState === "unavailable"
                    ? "Cette fonctionnalité est disponible sur Chrome Android et Safari iOS 16+."
                    : "Autorisez l'accès aux contacts dans les réglages de votre navigateur, puis réessayez."}
                </p>
                <p className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>Connectez plutôt un réseau social :</p>
                <div className="flex flex-col gap-2">
                  {SOCIAL_NETWORKS.map(sn => (
                    <button key={sn.id} onClick={() => { setShowContactsPanel(false); setShowSocialPanel(true) }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] touch-manipulation"
                      style={{ background: `color-mix(in srgb, ${sn.color} 10%, var(--card))`, border: `1px solid color-mix(in srgb, ${sn.color} 25%, var(--border))`, color: sn.color, minHeight: 44 }}>
                      <sn.Icon size={16} /><span className="font-medium">{sn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des suggestions */}
            {suggestions.length > 0 && (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "color-mix(in srgb, var(--primary) 15%, var(--card))", color: "var(--primary)" }}>
                        {(s.name || s.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {s.name && <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{s.name}</p>}
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{s.email}</p>
                      </div>
                    </div>
                    <button onClick={() => applySuggestion(s)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 touch-manipulation"
                      style={{ background: "color-mix(in srgb, var(--primary) 12%, var(--card))", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 25%, var(--border))", minHeight: 32 }}>
                      Inviter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </>

      {/* ── Panel réseaux sociaux ── */}
      <>
        {showSocialPanel && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-5 rounded-2xl overflow-hidden"
            style={{ border: "1px solid color-mix(in srgb, #8B5CF6 20%, var(--border))" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "color-mix(in srgb, #8B5CF6 8%, var(--card))" }}>
              <div className="flex items-center gap-2">
                <Share2 size={16} style={{ color: "#8B5CF6" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Connecter un réseau social</span>
              </div>
              <button onClick={() => setShowSocialPanel(false)} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Connectez vos réseaux sociaux pour importer facilement vos proches dans votre cercle de confiance.
                Aucune publication ne sera jamais faite en votre nom.
              </p>
              <div className="flex flex-col gap-2">
                {SOCIAL_NETWORKS.map(sn => {
                  const connected  = connectedSocials.includes(sn.id)
                  const connecting = socialConnecting === sn.id
                  return (
                    <button key={sn.id} onClick={() => !connected && connectSocial(sn.id)} disabled={connecting || connected}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all active:scale-[0.98] touch-manipulation"
                      style={{ background: connected ? `color-mix(in srgb, ${sn.color} 10%, var(--card))` : "var(--card)", border: `1.5px solid ${connected ? sn.color : "var(--border)"}`, opacity: connecting ? 0.7 : 1, minHeight: 56 }}>
                      <sn.Icon size={20} style={{ color: sn.color, flexShrink: 0 }} />
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{sn.label}</p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{sn.desc}</p>
                      </div>
                      {connected ? (
                        <CheckCircle2 size={18} style={{ color: sn.color, flexShrink: 0 }} />
                      ) : connecting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin flex-shrink-0" style={{ borderTopColor: sn.color }} />
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
                          style={{ background: `color-mix(in srgb, ${sn.color} 12%, var(--card))`, color: sn.color }}>Connecter</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </>

      {/* ── Panel recherche membres Milele ── */}
      <>
        {showMemberSearch && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-5 rounded-2xl overflow-hidden"
            style={{ border: "1px solid color-mix(in srgb, #0EA5E9 24%, var(--border))" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "color-mix(in srgb, #0EA5E9 8%, var(--card))" }}>
              <div className="flex items-center gap-2">
                <Search size={16} style={{ color: "#0EA5E9" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Trouver un membre Milele</span>
              </div>
              <button onClick={() => setShowMemberSearch(false)} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-2 mb-3">
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void searchMileleMembers() }}
                  placeholder="Nom ou email (min. 2 caractères)"
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                />
                <button onClick={() => void searchMileleMembers()}
                  className="px-4 py-3 rounded-xl text-sm font-semibold touch-manipulation"
                  style={{ background: "#0EA5E9", color: "white", minHeight: 44 }}>
                  Chercher
                </button>
              </div>

              {memberSearching && (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Recherche en cours…</p>
              )}

              {!memberSearching && memberQuery.trim().length >= 2 && memberResults.length === 0 && (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Aucun membre public trouvé pour cette recherche.
                </p>
              )}

              {memberResults.length > 0 && (
                <div className="mt-2 divide-y" style={{ borderColor: "var(--border)" }}>
                  {memberResults.map((m) => {
                    const hasPending = m.connectionStatus === "pending" || outgoingRequests.some((r) => r.target_id === m.id)
                    const sending = sendingToMemberId === m.id
                    const cancelling = !!outgoingRequests.find((r) => r.target_id === m.id && r.id === cancellingRequestId)
                    return (
                      <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: "color-mix(in srgb, #0EA5E9 16%, var(--card))", color: "#0EA5E9" }}>
                            {(m.display_name ?? "M")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                              {m.display_name ?? "Membre Milele"}
                            </p>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              Compte Milele vérifié
                            </p>
                          </div>
                        </div>

                        {hasPending ? (
                          <button
                            onClick={() => void cancelMemberRequest(m.id)}
                            disabled={cancelling}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation"
                            style={{ background: "color-mix(in srgb, #EF4444 10%, var(--card))", color: "#EF4444", border: "1px solid color-mix(in srgb, #EF4444 24%, var(--border))" }}>
                            {cancelling ? "Annulation…" : "Annuler demande"}
                          </button>
                        ) : (
                          <button
                            onClick={() => void sendMemberRequest(m.id)}
                            disabled={sending}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation"
                            style={{ background: "color-mix(in srgb, var(--primary) 10%, var(--card))", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 24%, var(--border))" }}>
                            {sending ? "Envoi…" : "Demander l'ajout"}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </>

      {/* Formulaire invitation */}
      <>
        {showForm && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-6 p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Inviter un membre</h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Prénom Nom"
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Courriel *"
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>

            {/* Niveau de visibilité */}
            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Niveau d&apos;accès</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VISIBILITY_TIERS.map(tier => (
                  <button key={tier.key} type="button" onClick={() => setVisibilityLevel(tier.key)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all active:scale-95 touch-manipulation"
                    style={{
                      border: `1.5px solid ${visibilityLevel === tier.key ? tier.color : "var(--border)"}`,
                      background: visibilityLevel === tier.key ? `color-mix(in srgb, ${tier.color} 10%, var(--card))` : "var(--card)",
                      color: visibilityLevel === tier.key ? tier.color : "var(--muted-foreground)",
                      minHeight: 60,
                    }}>
                    <span className="text-lg">{tier.icon}</span>
                    <span className="font-medium">{tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rôle */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Rôle</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(ROLE_CONFIG) as [keyof typeof ROLE_CONFIG, typeof ROLE_CONFIG.member][]).map(([key, cfg]) => (
                  <button key={key} type="button" onClick={() => setRole(key)}
                    className="p-3 rounded-xl text-xs text-left transition-all active:scale-95 touch-manipulation"
                    style={{
                      border: `1.5px solid ${role === key ? cfg.color : "var(--border)"}`,
                      background: role === key ? `color-mix(in srgb, ${cfg.color} 10%, var(--card))` : "var(--card)",
                      color: role === key ? cfg.color : "var(--muted-foreground)",
                      minHeight: 60,
                    }}>
                    <p className="font-semibold mb-0.5">{cfg.label}</p>
                    <p className="opacity-70 text-[10px] leading-tight">{cfg.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <LiquidMetalButton label={saving ? "Invitation…" : "Envoyer l'invitation"}
                width={200} height={44} fontSize={13} tinted onClick={handleSubmit}
                disabled={saving || !email.trim()} />
            </div>
          </div>
        )}
      </>

      {/* Membres par niveau */}
      {!showForm && <GenealogyManager members={genealogyMembers} />}

      {/* Membres par niveau */}
      {members.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--muted-foreground)" }} />
          <input type="text" value={circleSearch} onChange={e => setCircleSearch(e.target.value)}
            placeholder="Rechercher dans votre cercle…" className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }} />
          {circleSearch && (
            <button onClick={() => setCircleSearch("")}>
              <X size={13} style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>
      )}

      {filteredCircleMembers.length === 0 && !showForm ? (
        <EmptyState icon="👥" title="Votre cercle est vide" description="Invitez vos proches de confiance pour qu'ils puissent accéder à votre héritage le moment venu."
          actionLabel="Inviter un proche" onAction={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {VISIBILITY_TIERS.filter(tier => filteredMembersByLevel[tier.key].length > 0).map(tier => (
            <div key={tier.key} className="rounded-2xl overflow-hidden" style={{ border: `1px solid color-mix(in srgb, ${tier.color} 18%, var(--border))` }}>
              {/* Niveau header */}
              <button onClick={() => setExpandedLevel(expandedLevel === tier.key ? null : tier.key)}
                className="w-full flex items-center justify-between px-4 py-3 touch-manipulation"
                style={{ background: `color-mix(in srgb, ${tier.color} 8%, var(--card))` }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{tier.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: tier.color }}>{tier.label}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: `color-mix(in srgb, ${tier.color} 15%, transparent)`, color: tier.color }}>
                    {filteredMembersByLevel[tier.key].length}
                  </span>
                </div>
                <ChevronDown size={16} style={{ color: tier.color, transform: expandedLevel === tier.key ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              <>
                {expandedLevel === tier.key && (
                  <div style={{ overflow: "hidden" }}>
                    {filteredMembersByLevel[tier.key].map(member => {
                      const roleInfo = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]
                      const statusColor = member.status === "active"
                        ? "var(--primary)"
                        : member.status === "pending"
                          ? "#F59E0B"
                          : "#64748B"
                      const statusLabel = member.status === "active"
                        ? "Actif"
                        : member.status === "pending"
                          ? "En attente"
                          : "Ancien"
                      return (
                        <div key={member.id} className="flex items-center justify-between gap-3 px-4 py-3"
                          style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: `color-mix(in srgb, ${tier.color} 18%, var(--card))`, color: tier.color }}>
                              {(member.display_name || member.email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                                  {member.display_name || member.email}
                                </p>
                                {roleInfo && member.role !== "member" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                                    style={{ background: `color-mix(in srgb, ${roleInfo.color} 14%, var(--card))`, color: roleInfo.color, border: `1px solid color-mix(in srgb, ${roleInfo.color} 30%, transparent)` }}>
                                    {roleInfo.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                                {member.display_name ? member.email : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: `color-mix(in srgb, ${statusColor} 10%, transparent)`, color: statusColor }}>
                              {statusLabel}
                            </span>
                            {member.status !== "removed" && (
                              <button onClick={() => removeMember(member.id)} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "#EF4444", minWidth: 32, minHeight: 32 }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
