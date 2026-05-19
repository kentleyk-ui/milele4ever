"use client"

import { useState, useEffect } from "react"
import { Plus, X, Clock, Send, Lock, Eye, EyeOff, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import VisibilitySelector from "@/components/aion/VisibilitySelector"
import EmptyState from "@/components/aion/EmptyState"
import VisibilityBadge from "@/components/aion/VisibilityBadge"
import { formatDate } from "@/lib/aion-dates"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import type { CapsuleTemporelle, VisibilityLevel } from "@/types/aion"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "var(--muted-foreground)" },
  scheduled: { label: "Programmée", color: "#3B82F6" },
  delivered: { label: "Envoyée", color: "var(--primary)" },
  opened: { label: "Ouverte", color: "#8B5CF6" },
  cancelled: { label: "Annulée", color: "#EF4444" },
}

export default function CapsulesPage() {
  const [capsules, setCapsules] = useState<CapsuleTemporelle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Compte à rebours et préviews
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function countdown(isoDate: string | null): string {
    if (!isoDate) return ""
    const diff = new Date(isoDate).getTime() - Date.now()
    if (diff <= 0) return "Date passée"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 365) return `dans ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`
    if (days > 30) return `dans ${Math.floor(days / 30)} mois`
    return `dans ${days} jour${days > 1 ? "s" : ""}`
  }

  // Champs formulaire
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [deliverAt, setDeliverAt] = useState("")
  const [message, setMessage] = useState("")
  const [triggerType, setTriggerType] = useState<"date" | "death">("date")

  const fetchCapsules = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("capsules_temporelles").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
    setCapsules((data as CapsuleTemporelle[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchCapsules() }, [])

  const resetForm = () => {
    setRecipientEmail(""); setRecipientName(""); setDeliverAt("")
    setMessage(""); setTriggerType("date"); setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!recipientEmail.trim() || !message.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase.from("capsules_temporelles").insert({
      owner_id: user.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName || null,
      trigger_type: triggerType,
      deliver_at: deliverAt || null,
      personal_message: message,
      status: deliverAt || triggerType === "death" ? "scheduled" : "draft",
    })
    setSaving(false)
    resetForm()
    fetchCapsules()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("capsules_temporelles").delete().eq("id", id)
    fetchCapsules()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
    </div>
  )

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, #3B82F6 15%, var(--card))" }}>💊</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Capsules Temporelles</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Messages programmés pour le futur</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}>
            <Plus size={16} /><span className="hidden sm:inline">Créer</span>
          </button>
        )}
      </div>

      {/* Formulaire */}
      <>
        {showForm && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-6 p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, #3B82F6 20%, var(--border))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nouvelle capsule</h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>

            {/* Déclencheur */}
            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Déclencheur</p>
              <div className="grid grid-cols-2 gap-2">
                {([{ key: "date", label: "📅 À une date", desc: "Envoyée automatiquement" }, { key: "death", label: "🕊️ Après le passage", desc: "Transmise par Milele" }] as const).map(t => (
                  <button key={t.key} type="button" onClick={() => setTriggerType(t.key)}
                    className="p-3 rounded-xl text-xs text-left transition-all active:scale-95 touch-manipulation"
                    style={{
                      border: `1.5px solid ${triggerType === t.key ? "#3B82F6" : "var(--border)"}`,
                      background: triggerType === t.key ? "color-mix(in srgb, #3B82F6 10%, var(--card))" : "var(--card)",
                      color: triggerType === t.key ? "#3B82F6" : "var(--muted-foreground)",
                      minHeight: 56,
                    }}>
                    <p className="font-medium">{t.label}</p>
                    <p className="opacity-70">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nom du destinataire"
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
              <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="Courriel du destinataire *"
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>

            {triggerType === "date" && (
              <input type="date" value={deliverAt} onChange={e => setDeliverAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            )}

            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Votre message…"
              rows={5} className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />

            <div className="flex justify-end">
              <LiquidMetalButton label={saving ? "Enregistrement…" : "Créer la capsule"}
                width={180} height={44} fontSize={13} tinted onClick={handleSubmit}
                disabled={saving || !recipientEmail.trim() || !message.trim()} />
            </div>
          </div>
        )}
      </>

      {/* Liste */}
      {capsules.length === 0 && !showForm ? (
        <EmptyState icon="💊" title="Aucune capsule" description="Créez des messages qui seront transmis à vos proches à une date ou après votre passage."
          actionLabel="Créer une capsule" onAction={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {capsules.map(c => {
            const st = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft
            const isExpanded = expandedId === c.id
            const cdText = countdown(c.deliver_at)
            return (
              <div key={c.id} className="rounded-2xl overflow-hidden transition-all"
                style={{ background: "var(--card)", border: `1px solid color-mix(in srgb, ${st.color} 18%, var(--border))` }}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        Pour : {c.recipient_name || c.recipient_email}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.recipient_email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium"
                        style={{ color: st.color, borderColor: `color-mix(in srgb, ${st.color} 30%, transparent)`, background: `color-mix(in srgb, ${st.color} 10%, transparent)` }}>
                        {st.label}
                      </span>
                      <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="p-1.5 rounded-lg touch-manipulation" title="Voir le message"
                        style={{ color: isExpanded ? "var(--primary)" : "var(--muted-foreground)" }}>
                        {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "#EF4444" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Compte à rebours */}
                  {c.deliver_at && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} style={{ color: "#3B82F6" }} />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(c.deliver_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      {cdText && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "color-mix(in srgb, #3B82F6 12%, var(--card))", color: "#3B82F6" }}>
                          {cdText}
                        </span>
                      )}
                    </div>
                  )}

                  {c.trigger_type === "death" && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Lock size={11} style={{ color: "#8B5CF6" }} />
                      <span className="text-xs" style={{ color: "#8B5CF6" }}>Transmise après le passage</span>
                    </div>
                  )}
                </div>

                {/* Message preview (toggle) */}
                {isExpanded && c.personal_message && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="p-3 rounded-xl text-sm leading-relaxed"
                      style={{ background: "var(--secondary)", color: "var(--foreground)", borderLeft: "3px solid var(--primary)", fontStyle: "italic" }}>
                      “{c.personal_message}”
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
