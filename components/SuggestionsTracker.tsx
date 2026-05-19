"use client"

import { useState, useEffect } from "react"
import { RefreshCw, ExternalLink, Bug, Lightbulb, Palette, PenLine, FileText, User } from "lucide-react"
import deployments from "../feedback_deployments.json"
import { supabase } from "@/lib/supabaseClient"

interface Suggestion {
  id: string
  type: string
  name: string
  message: string
  status: "new" | "in-progress" | "done"
  date: string
  note: string
  creatorUpdate?: string | null
  adminComment?: string | null
  resolutionSummary?: string | null
  creatorReply?: string | null
  githubUrl?: string
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  bug: { icon: <Bug size={14} />, label: "Bug", color: "oklch(0.65 0.2 25)" },
  suggestion: { icon: <Lightbulb size={14} />, label: "Suggestion", color: "oklch(0.7 0.15 85)" },
  typo: { icon: <PenLine size={14} />, label: "Orthographe", color: "oklch(0.6 0.15 260)" },
  design: { icon: <Palette size={14} />, label: "Design", color: "oklch(0.65 0.18 310)" },
  autre: { icon: <FileText size={14} />, label: "Autre", color: "oklch(0.6 0.05 220)" },
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  done: { label: "✅ Corrigé", bg: "oklch(0.9 0.12 150 / 0.2)", text: "oklch(0.45 0.15 150)" },
  "in-progress": { label: "🔄 En cours", bg: "oklch(0.9 0.12 85 / 0.2)", text: "oklch(0.5 0.15 85)" },
  new: { label: "🆕 Nouveau", bg: "oklch(0.9 0.08 250 / 0.2)", text: "oklch(0.5 0.12 250)" },
}

function StatusButton({ id, status, onStatusChange }: { id: string, status: string, onStatusChange: (s: string) => void }) {
  const nextStatus = status === "new" ? "in-progress" : status === "in-progress" ? "done" : "new"
  const label = status === "new" ? "Commencer" : status === "in-progress" ? "Corriger" : "Réinitialiser"
  return (
    <button
      className="ml-2 px-2 py-1 min-h-[36px] min-w-[44px] rounded bg-primary text-primary-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={() => onStatusChange(nextStatus)}
      title={label}
      aria-label={label}
      tabIndex={0}
    >
      {label}
    </button>
  )
}

export function SuggestionsTracker() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "done">("all")
  const [token, setToken] = useState("")
  const [drafts, setDrafts] = useState<Record<string, { adminComment: string; resolutionSummary: string; creatorReply: string }>>({})

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/feedback/list")
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    } catch {
      console.error("Failed to fetch suggestions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSuggestions()
    void (async () => {
      const { data } = await supabase.auth.getSession()
      setToken(data.session?.access_token ?? "")
    })()
  }, [])

  // Comptage dynamique selon le filtre appliqué
  const filtered = filter === "all"
    ? suggestions
    : filter === "done"
      ? suggestions.filter((s) => !s.status || s.status === "done")
      : suggestions.filter((s) => s.status === filter)

  // Les compteurs reflètent exactement le contenu de chaque section
  const counts = {
    all: suggestions.length,
    new: suggestions.filter((s) => s.status === "new").length,
    "in-progress": suggestions.filter((s) => s.status === "in-progress").length,
    done: suggestions.filter((s) => !s.status || s.status === "done").length,
  }

  // Section déploiements
  const deploymentsList = Array.isArray(deployments) ? deployments : [];

  const handleStatusChange = async (id: string, newStatus: string) => {
    const draft = drafts[id] ?? { adminComment: "", resolutionSummary: "", creatorReply: "" }
    await fetch("/api/feedback/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id,
        status: newStatus,
        adminComment: draft.adminComment,
        resolutionSummary: draft.resolutionSummary,
        creatorReply: draft.creatorReply,
      })
    })
    void fetchSuggestions()
  }

  const updateDraft = (
    id: string,
    patch: Partial<{ adminComment: string; resolutionSummary: string; creatorReply: string }>
  ) => {
    setDrafts((prev) => {
      const current = prev[id] ?? { adminComment: "", resolutionSummary: "", creatorReply: "" }
      return { ...prev, [id]: { ...current, ...patch } }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Suivi des Suggestions
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {suggestions.length} feedback{suggestions.length > 1 ? "s" : ""} reçu{suggestions.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{
            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
            color: "var(--primary)",
          }}
          aria-label="Rafraîchir les suggestions"
          tabIndex={0}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "new", "in-progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filter === f
                ? "var(--primary)"
                : "color-mix(in srgb, var(--muted) 50%, transparent)",
              color: filter === f ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}
          >
            {f === "all" ? "Tous" : f === "new" ? "Nouveau" : f === "in-progress" ? "En cours" : "Corrigé"}
            <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: "color-mix(in srgb, var(--muted) 30%, transparent)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--muted) 20%, transparent)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Aucun feedback pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const tConf = typeConfig[s.type] || typeConfig.autre
            const sConf = statusConfig[s.status] || statusConfig.new

            return (
              <div
                key={s.id}
                className="rounded-2xl p-4 transition-all hover:scale-[1.005]"
                style={{
                  background: "color-mix(in srgb, var(--card) 90%, transparent)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Type badge */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 mt-0.5"
                    style={{ background: `${tConf.color} / 0.12)`.replace(")", " / 0.12)"), color: tConf.color }}
                  >
                    {tConf.icon}
                    {tConf.label}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                      {s.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {s.name}
                      </span>
                      <span>#{s.id}</span>
                      <span>{new Date(s.date).toLocaleDateString("fr-CA")}</span>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                      style={{ background: sConf.bg, color: sConf.text }}
                    >
                      {sConf.label}
                    </span>
                    <StatusButton id={s.id} status={s.status} onStatusChange={(st) => handleStatusChange(s.id, st)} />
                    {s.githubUrl && (
                      <a
                        href={s.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ color: "var(--muted-foreground)" }}
                        title="Voir sur GitHub"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Note */}
                {s.note && (
                  <p
                    className="mt-2 ml-[calc(theme(spacing.3)+2.5rem)] text-[11px] italic"
                    style={{ color: "var(--muted-foreground)", opacity: 0.7 }}
                  >
                    {s.note}
                  </p>
                )}
                {s.creatorUpdate && (
                  <p className="mt-2 ml-[calc(theme(spacing.3)+2.5rem)] text-[11px] text-sky-300">
                    Update demandé: {s.creatorUpdate}
                  </p>
                )}
                {s.adminComment && (
                  <p className="mt-2 ml-[calc(theme(spacing.3)+2.5rem)] text-[11px] text-amber-200">
                    Commentaire staff: {s.adminComment}
                  </p>
                )}
                {s.resolutionSummary && (
                  <p className="mt-2 ml-[calc(theme(spacing.3)+2.5rem)] text-[11px] text-emerald-200">
                    Résumé: {s.resolutionSummary}
                  </p>
                )}
                {s.creatorReply && (
                  <p className="mt-2 ml-[calc(theme(spacing.3)+2.5rem)] text-[11px] text-cyan-200">
                    Réponse: {s.creatorReply}
                  </p>
                )}
                <div className="mt-3 ml-[calc(theme(spacing.3)+2.5rem)] grid gap-2 md:grid-cols-3">
                  <textarea
                    rows={2}
                    placeholder="Commentaire staff"
                    className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs"
                    value={drafts[s.id]?.adminComment ?? s.adminComment ?? ""}
                    onChange={(e) => updateDraft(s.id, { adminComment: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    placeholder="Résumé résolution"
                    className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs"
                    value={drafts[s.id]?.resolutionSummary ?? s.resolutionSummary ?? ""}
                    onChange={(e) => updateDraft(s.id, { resolutionSummary: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    placeholder="Réponse créateur"
                    className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs"
                    value={drafts[s.id]?.creatorReply ?? s.creatorReply ?? ""}
                    onChange={(e) => updateDraft(s.id, { creatorReply: e.target.value })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Déploiements récents */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--primary)" }}>
          Déploiements récents
        </h3>
        <ul className="space-y-2">
          {deploymentsList.map((d) => (
            <li key={d.id} className="rounded-xl p-3 bg-[oklch(0.9_0.12_150_/_0.13)] border border-[oklch(0.42_0.10_152_/_0.13)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{d.title}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{new Date(d.date).toLocaleDateString("fr-CA")}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--foreground)" }}>{d.details}</div>
              {d.note && <div className="text-[10px] italic mt-1 text-muted-foreground">{d.note}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
