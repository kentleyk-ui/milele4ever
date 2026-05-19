"use client"

import { useEffect, useState, useCallback } from "react"
import { Lock, ArrowLeft, RefreshCw, Plus, MessageSquare, CheckCircle2, Clock3, Lightbulb, Bug, Palette, PenLine, FileText, Trash2, ChevronDown, ChevronUp, Save, X } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface SuggestionData {
  id: string | number
  name: string
  type: string
  message: string
  status: "new" | "in-progress" | "done"
  date: string
  adminComment?: string | null
  resolutionSummary?: string | null
  creatorReply?: string | null
  creatorUpdate?: string | null
  creatorUpdateMethod?: "email" | "telegram" | null
  creatorUpdateContact?: string | null
  creatorUserId?: string | null
  url?: string
}

interface EditingState {
  id: string | number
  adminComment: string
  resolutionSummary: string
  creatorReply: string
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; bg: string }> = {
  bug: { icon: <Bug size={16} />, label: "Bug", bg: "oklch(0.65 0.2 25)" },
  suggestion: { icon: <Lightbulb size={16} />, label: "Suggestion", bg: "oklch(0.7 0.15 85)" },
  typo: { icon: <PenLine size={16} />, label: "Orthographe", bg: "oklch(0.6 0.15 260)" },
  design: { icon: <Palette size={16} />, label: "Design", bg: "oklch(0.65 0.18 310)" },
  autre: { icon: <FileText size={16} />, label: "Autre", bg: "oklch(0.6 0.05 220)" },
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  new: { icon: <Plus size={16} />, label: "🆕 Nouveau", bg: "oklch(0.9 0.08 250 / 0.2)", text: "oklch(0.5 0.12 250)" },
  "in-progress": { icon: <Clock3 size={16} />, label: "🔄 En cours", bg: "oklch(0.9 0.12 85 / 0.2)", text: "oklch(0.5 0.15 85)" },
  done: { icon: <CheckCircle2 size={16} />, label: "✅ Résolu", bg: "oklch(0.9 0.12 150 / 0.2)", text: "oklch(0.45 0.15 150)" },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}j`

  return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
}

function SuggestionCard({ 
  suggestion, 
  onStatusChange, 
  onEdit,
  editing,
  onUpdateEdit,
  onSaveEdit,
  onCancelEdit,
  isSaving
}: { 
  suggestion: SuggestionData
  onStatusChange: (id: string | number, newStatus: "new" | "in-progress" | "done") => Promise<void>
  onEdit: (id: string | number) => void
  editing: EditingState | null
  onUpdateEdit: (patch: Partial<EditingState>) => void
  onSaveEdit: (id: string | number) => Promise<void>
  onCancelEdit: () => void
  isSaving: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [focusedEditField, setFocusedEditField] = useState<"adminComment" | "resolutionSummary" | "creatorReply" | null>(null)
  const tConf = typeConfig[suggestion.type] || typeConfig.autre
  const isEditing = editing?.id === suggestion.id

  const liquidEditPanelStyle = {
    background: "color-mix(in srgb, var(--card) 90%, transparent)",
    border: "1px solid color-mix(in srgb, var(--primary) 14%, var(--border))",
    boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.2), 0 8px 18px oklch(0.12 0.03 220 / 0.12)",
  }

  const liquidEditFieldStyle = {
    background: "linear-gradient(180deg, color-mix(in srgb, var(--background) 78%, transparent), color-mix(in srgb, var(--card) 75%, transparent))",
    border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
    color: "var(--foreground)",
    backdropFilter: "blur(12px)",
    boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.22), inset 0 -1px 0 oklch(0 0 0 / 0.1)",
  }

  const getEditFieldStyle = (field: "adminComment" | "resolutionSummary" | "creatorReply") => ({
    ...liquidEditFieldStyle,
    border: focusedEditField === field
      ? "1px solid color-mix(in srgb, var(--primary) 50%, transparent)"
      : liquidEditFieldStyle.border,
    boxShadow: focusedEditField === field
      ? "inset 0 1px 0 oklch(1 0 0 / 0.3), 0 0 0 1px color-mix(in srgb, var(--primary) 25%, transparent), 0 10px 20px color-mix(in srgb, var(--primary) 15%, transparent)"
      : liquidEditFieldStyle.boxShadow,
  })

  const nextStatus: "new" | "in-progress" | "done" =
    suggestion.status === "new" ? "in-progress" : suggestion.status === "in-progress" ? "done" : "new"
  const statusButtons = {
    new: { label: "Commencer", nextStatus: "in-progress" as const },
    "in-progress": { label: "Marquer résolu", nextStatus: "done" as const },
    done: { label: "Réouvrir", nextStatus: "new" as const },
  }

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 transition-all hover:shadow-lg"
      style={{
        background: "color-mix(in srgb, var(--card) 95%, transparent)",
        border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ background: `${tConf.bg}20` }}
        >
          <span style={{ color: tConf.bg }}>{tConf.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="text-xs font-medium opacity-70" style={{ color: "var(--muted-foreground)" }}>
                {suggestion.name}
              </p>
              <h3 className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                {suggestion.message.length > 100
                  ? suggestion.message.substring(0, 100) + "..."
                  : suggestion.message}
              </h3>
            </div>
            <span className="text-xs opacity-60 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
              {formatDate(suggestion.date)}
            </span>
          </div>
          
          {/* URL if available */}
          {suggestion.url && (
            <a
              href={suggestion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              📍 Page
            </a>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="px-2 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1"
          style={{
            background: statusConfig[suggestion.status].bg,
            color: statusConfig[suggestion.status].text,
          }}
        >
          {statusConfig[suggestion.status].icon}
          {statusConfig[suggestion.status].label}
        </div>
      </div>

      {/* Expandable Details */}
      {!isEditing && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-medium transition-all p-2 -mx-2 mb-2 rounded"
          style={{ color: "var(--primary)" }}
        >
          <span>{expanded ? "Masquer détails" : "Voir détails"}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      {expanded && !isEditing && (
        <div className="space-y-2 mb-4 p-3 rounded-lg" style={{ background: "color-mix(in srgb, var(--background) 50%, transparent)" }}>
          {suggestion.adminComment && (
            <div>
              <p className="text-xs font-medium opacity-70 mb-1" style={{ color: "var(--muted-foreground)" }}>
                💬 Commentaire Admin
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {suggestion.adminComment}
              </p>
            </div>
          )}
          {suggestion.resolutionSummary && (
            <div>
              <p className="text-xs font-medium opacity-70 mb-1" style={{ color: "var(--muted-foreground)" }}>
                ✨ Résumé Résolution
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {suggestion.resolutionSummary}
              </p>
            </div>
          )}
          {suggestion.creatorReply && (
            <div>
              <p className="text-xs font-medium opacity-70 mb-1" style={{ color: "var(--muted-foreground)" }}>
                👤 Réponse Créateur
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {suggestion.creatorReply}
              </p>
            </div>
          )}
          {suggestion.creatorUpdate && !(suggestion.creatorUpdateMethod && suggestion.creatorUpdateContact) && (
            <div>
              <p className="text-xs font-medium opacity-70 mb-1" style={{ color: "var(--muted-foreground)" }}>
                🔄 Mise à jour Créateur
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {suggestion.creatorUpdate}
              </p>
            </div>
          )}
          {suggestion.creatorUpdateMethod && suggestion.creatorUpdateContact && (
            <div>
              <p className="text-xs font-medium opacity-70 mb-1" style={{ color: "var(--muted-foreground)" }}>
                📨 Canal de contact
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                {suggestion.creatorUpdateMethod === "email" ? "Courriel" : "Telegram"}: {suggestion.creatorUpdateContact}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Editing Mode */}
      {isEditing && (
        <div className="space-y-3.5 mb-4">
          <div className="relative overflow-hidden rounded-xl p-2.5" style={liquidEditPanelStyle}>
            <div
              className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
              style={{
                opacity: focusedEditField === "adminComment" ? 1 : 0,
                background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 13%, transparent) 50%, transparent 86%)",
              }}
            />
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              💬 Commentaire Admin
            </label>
            <textarea
              value={editing.adminComment}
              onChange={(e) => onUpdateEdit({ adminComment: e.target.value })}
              onFocus={() => setFocusedEditField("adminComment")}
              onBlur={() => setFocusedEditField((prev) => (prev === "adminComment" ? null : prev))}
              placeholder="Commentaire interne..."
              className="w-full px-3 py-2.5 rounded-lg text-xs resize-none min-h-[86px]"
              rows={3}
              style={getEditFieldStyle("adminComment")}
            />
          </div>

          <div className="relative overflow-hidden rounded-xl p-2.5" style={liquidEditPanelStyle}>
            <div
              className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
              style={{
                opacity: focusedEditField === "resolutionSummary" ? 1 : 0,
                background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 13%, transparent) 50%, transparent 86%)",
              }}
            />
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              ✨ Résumé Résolution
            </label>
            <textarea
              value={editing.resolutionSummary}
              onChange={(e) => onUpdateEdit({ resolutionSummary: e.target.value })}
              onFocus={() => setFocusedEditField("resolutionSummary")}
              onBlur={() => setFocusedEditField((prev) => (prev === "resolutionSummary" ? null : prev))}
              placeholder="Décrivez la solution apportée..."
              className="w-full px-3 py-2.5 rounded-lg text-xs resize-none min-h-[86px]"
              rows={3}
              style={getEditFieldStyle("resolutionSummary")}
            />
          </div>

          <div className="relative overflow-hidden rounded-xl p-2.5" style={liquidEditPanelStyle}>
            <div
              className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
              style={{
                opacity: focusedEditField === "creatorReply" ? 1 : 0,
                background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 13%, transparent) 50%, transparent 86%)",
              }}
            />
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              👤 Réponse Créateur
            </label>
            <textarea
              value={editing.creatorReply}
              onChange={(e) => onUpdateEdit({ creatorReply: e.target.value })}
              onFocus={() => setFocusedEditField("creatorReply")}
              onBlur={() => setFocusedEditField((prev) => (prev === "creatorReply" ? null : prev))}
              placeholder="Message à montrer au créateur..."
              className="w-full px-3 py-2.5 rounded-lg text-xs resize-none min-h-[86px]"
              rows={3}
              style={getEditFieldStyle("creatorReply")}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEditing ? (
          <>
            <button
              onClick={() => onSaveEdit(suggestion.id)}
              disabled={isSaving}
              className="px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 84%, oklch(1 0 0 / 0.06)), var(--primary))",
                color: "var(--primary-foreground)",
                border: "1px solid color-mix(in srgb, var(--primary) 45%, transparent)",
                boxShadow: "0 8px 18px color-mix(in srgb, var(--primary) 25%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.28)",
              }}
            >
              <Save size={14} />
              Enregistrer
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all"
              style={{
                background: "color-mix(in srgb, var(--muted) 42%, transparent)",
                color: "var(--muted-foreground)",
                border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))",
              }}
            >
              <X size={14} />
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(suggestion.id)}
              className="px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              style={{
                background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                color: "var(--primary)",
              }}
            >
              <MessageSquare size={14} />
              Éditer
            </button>
            <button
              onClick={() => onStatusChange(suggestion.id, statusButtons[suggestion.status].nextStatus)}
              className="px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {statusButtons[suggestion.status].label}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminSuggestionsPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([])
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "milele2024") {
      setAuthenticated(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/feedback/list")
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error("Failed to fetch suggestions:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return

    void fetchSuggestions()
    void (async () => {
      const { data } = await supabase.auth.getSession()
      setToken(data.session?.access_token ?? "")
    })()

    // Real-time updates
    const channel = supabase
      .channel("feedbacks-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedbacks" }, () => {
        void fetchSuggestions()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [authenticated, fetchSuggestions])

  const handleStatusChange = async (id: string | number, newStatus: "new" | "in-progress" | "done") => {
    if (!token) return

    try {
      const res = await fetch("/api/feedback/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: String(id),
          status: newStatus,
          adminComment: editing?.adminComment || "",
          resolutionSummary: editing?.resolutionSummary || "",
          creatorReply: editing?.creatorReply || "",
        }),
      })

      if (res.ok) {
        setEditing(null)
        await fetchSuggestions()
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handleEdit = (id: string | number) => {
    const suggestion = suggestions.find((s) => s.id === id)
    if (!suggestion) return

    setEditing({
      id,
      adminComment: suggestion.adminComment || "",
      resolutionSummary: suggestion.resolutionSummary || "",
      creatorReply: suggestion.creatorReply || "",
    })
  }

  const handleSaveEdit = async (id: string | number) => {
    if (!editing || !token) return

    setIsSaving(true)
    try {
      const res = await fetch("/api/feedback/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: String(id),
          status: suggestions.find((s) => s.id === id)?.status || "new",
          adminComment: editing.adminComment,
          resolutionSummary: editing.resolutionSummary,
          creatorReply: editing.creatorReply,
        }),
      })

      if (res.ok) {
        setEditing(null)
        await fetchSuggestions()
      }
    } catch (err) {
      console.error("Failed to save edit:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Group suggestions by status
  const grouped = {
    new: suggestions.filter((s) => s.status === "new"),
    "in-progress": suggestions.filter((s) => s.status === "in-progress"),
    done: suggestions.filter((s) => s.status === "done"),
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs mb-6 transition-all hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={14} />
            Retour à l&apos;accueil
          </Link>

          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div
              className="w-full max-w-sm rounded-2xl p-6 sm:p-8"
              style={{
                background: "color-mix(in srgb, var(--card) 92%, transparent)",
                backdropFilter: "blur(24px)",
                border: "1px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
              }}
            >
              <div className="flex flex-col items-center mb-6">
                <div
                  className="p-3 rounded-xl mb-3"
                  style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
                >
                  <Lock size={24} style={{ color: "var(--primary)" }} />
                </div>
                <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  Panneau Admin
                </h1>
                <p className="text-xs mt-2 text-center" style={{ color: "var(--muted-foreground)" }}>
                  Accès au suivi des suggestions et feedback
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(false)
                  }}
                  placeholder="Mot de passe"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "color-mix(in srgb, var(--background) 80%, transparent)",
                    border: `1px solid ${
                      error ? "oklch(0.65 0.2 25)" : "color-mix(in srgb, var(--primary) 15%, var(--border))"
                    }`,
                    color: "var(--foreground)",
                  }}
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-center" style={{ color: "oklch(0.65 0.2 25)" }}>
                    ❌ Mot de passe incorrect
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Accéder
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              📋 Gestion des Suggestions
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
              {suggestions.length} feedback{suggestions.length !== 1 ? "s" : ""} reçu{suggestions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => void fetchSuggestions()}
            disabled={loading}
            className="p-3 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            style={{
              background: "color-mix(in srgb, var(--primary) 10%, transparent)",
              color: "var(--primary)",
            }}
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(["new", "in-progress", "done"] as const).map((status) => (
            <div key={status} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: statusConfig[status].bg }}>
                <span style={{ color: statusConfig[status].text }}>{statusConfig[status].icon}</span>
                <span className="font-semibold text-sm" style={{ color: statusConfig[status].text }}>
                  {statusConfig[status].label}
                </span>
                <span
                  className="ml-auto px-2 py-1 rounded text-xs font-bold"
                  style={{
                    background: statusConfig[status].text,
                    color: "white",
                  }}
                >
                  {grouped[status].length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1">
                {grouped[status].length === 0 ? (
                  <div
                    className="rounded-lg p-4 text-center text-xs"
                    style={{
                      background: "color-mix(in srgb, var(--muted) 20%, transparent)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Aucune suggestion
                  </div>
                ) : (
                  grouped[status].map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onStatusChange={handleStatusChange}
                      onEdit={handleEdit}
                      editing={editing}
                      onUpdateEdit={(patch) => {
                        if (editing) setEditing({ ...editing, ...patch })
                      }}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditing(null)}
                      isSaving={isSaving}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
