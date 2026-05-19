"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Send, MessageSquare } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [type, setType] = useState("")
  const [message, setMessage] = useState("")
  const [creatorUpdateMethod, setCreatorUpdateMethod] = useState<"" | "email" | "telegram">("")
  const [creatorUpdate, setCreatorUpdate] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [focusedField, setFocusedField] = useState<"name" | "type" | "message" | "creatorUpdateMethod" | "creatorUpdate" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const { data } = await supabase.auth.getSession()
      const creatorUserId = data.session?.user?.id ?? null

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: anonymous ? "Anonyme" : name,
          type,
          message,
          creatorUpdate,
          creatorUpdateMethod,
          creatorUpdateContact: creatorUpdate,
          creatorUserId,
          date: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      })

      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          onClose()
          setSent(false)
          setName("")
          setAnonymous(false)
          setType("")
          setMessage("")
          setCreatorUpdateMethod("")
          setCreatorUpdate("")
        }, 2000)
      } else {
        alert("Erreur lors de l'envoi. Réessayez.")
      }
    } catch {
      alert("Erreur réseau. Réessayez.")
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  const liquidFieldStyle = {
    background: "linear-gradient(180deg, color-mix(in srgb, var(--background) 75%, transparent), color-mix(in srgb, var(--card) 74%, transparent))",
    border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))",
    color: "var(--foreground)",
    backdropFilter: "blur(16px) saturate(1.25)",
    boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.24), inset 0 -1px 0 oklch(0 0 0 / 0.12), 0 8px 24px oklch(0.12 0.02 240 / 0.15)",
  }

  const liquidPanelStyle = {
    background: "color-mix(in srgb, var(--card) 86%, transparent)",
    border: "1px solid color-mix(in srgb, var(--primary) 16%, var(--border))",
    boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.2), 0 10px 28px oklch(0.14 0.03 240 / 0.13)",
  }

  const getFieldStyle = (field: "name" | "type" | "message" | "creatorUpdateMethod" | "creatorUpdate") => ({
    ...liquidFieldStyle,
    border: focusedField === field
      ? "1px solid color-mix(in srgb, var(--primary) 55%, transparent)"
      : liquidFieldStyle.border,
    boxShadow: focusedField === field
      ? "inset 0 1px 0 oklch(1 0 0 / 0.34), inset 0 -1px 0 oklch(0 0 0 / 0.14), 0 0 0 1px color-mix(in srgb, var(--primary) 28%, transparent), 0 12px 28px color-mix(in srgb, var(--primary) 18%, transparent)"
      : liquidFieldStyle.boxShadow,
  })

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 80% 10%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 60%), oklch(0.08 0.02 150 / 0.76)",
          backdropFilter: "blur(10px)",
        }}
      />

      {/* Modal */}
      <div
        className="relative mx-2 sm:mx-0 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        style={{
          background: "linear-gradient(155deg, color-mix(in srgb, var(--card) 94%, transparent), color-mix(in srgb, var(--muted) 35%, transparent))",
          backdropFilter: "blur(36px) saturate(1.5)",
          WebkitBackdropFilter: "blur(36px) saturate(1.5)",
          border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))",
          boxShadow: "0 -10px 70px oklch(0.1 0.02 220 / 0.32), inset 0 1px 0 oklch(1 0 0 / 0.26)",
          willChange: "transform, opacity",
        }}
      >
        <div
          className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 26%, transparent), transparent 72%)",
            filter: "blur(12px)",
          }}
        />

        {/* Barre d'accent */}
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 70%, transparent), transparent)",
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between px-4 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={liquidPanelStyle}>
              <MessageSquare size={16} style={{ color: "var(--primary)" }} />
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase" style={{ color: "var(--muted-foreground)" }}>
                Espace Creation
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
              Feedback & Suggestions
            </h2>
            <p className="text-xs sm:text-sm max-w-md pr-2" style={{ color: "var(--muted-foreground)" }}>
              Partagez une idee, un bug ou une amelioration. Nous traitons chaque retour comme un ticket prioritaire.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl transition-all hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              color: "var(--muted-foreground)",
              background: "color-mix(in srgb, var(--muted) 45%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))",
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.18)",
            }}
            aria-label="Fermer le feedback"
            tabIndex={0}
          >
            <X size={22} />
          </button>
        </div>

        {/* Contenu */}
        {sent ? (
          <div className="px-6 sm:px-7 py-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-base font-medium" style={{ color: "var(--foreground)" }}>Merci pour votre feedback !</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Votre message a ete envoye avec succes.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-4 sm:px-7 pb-5 sm:pb-7 space-y-3.5 sm:space-y-4"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            {/* Nom */}
            <div className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4" style={liquidPanelStyle}>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
                style={{
                  opacity: focusedField === "name" ? 1 : 0,
                  background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 14%, transparent) 48%, transparent 82%)",
                }}
              />
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Votre nom
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded accent-[var(--primary)] min-h-[24px] min-w-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Rester anonyme</span>
                </label>
              </div>
              <input
                type="text"
                placeholder={anonymous ? "Anonyme" : "Entrez votre nom..."}
                value={anonymous ? "" : name}
                onChange={(e) => setName(e.target.value)}
                disabled={anonymous}
                required={!anonymous}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField((prev) => (prev === "name" ? null : prev))}
                className="relative w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50 min-h-[48px] focus:outline-none"
                style={getFieldStyle("name")}
              />
            </div>

            {/* Type */}
            <div className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4" style={liquidPanelStyle}>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
                style={{
                  opacity: focusedField === "type" ? 1 : 0,
                  background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 14%, transparent) 48%, transparent 82%)",
                }}
              />
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
                Type de retour
              </label>
              <select
                value={type}
                onChange={(e) => {
                  if (e.target.value === "admin") {
                    onClose()
                    router.push("/admin/suggestions")
                    return
                  }
                  setType(e.target.value)
                }}
                onFocus={() => setFocusedField("type")}
                onBlur={() => setFocusedField((prev) => (prev === "type" ? null : prev))}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all min-h-[48px] focus:outline-none"
                style={{
                  ...getFieldStyle("type"),
                  willChange: "height",
                }}
              >
                <option value="">Sélectionnez une catégorie...</option>
                <option value="bug">🐛 Bug / Ne fonctionne pas</option>
                <option value="typo">✏️ Faute d&apos;orthographe</option>
                <option value="suggestion">💡 Suggestion / Idée</option>
                <option value="design">🎨 Problème visuel</option>
                <option value="autre">📝 Autre</option>
                <option value="admin">🔐 Admin</option>
              </select>
            </div>

            {/* Message */}
            <div className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4" style={liquidPanelStyle}>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
                style={{
                  opacity: focusedField === "message" ? 1 : 0,
                  background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 14%, transparent) 48%, transparent 82%)",
                }}
              />
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
                Votre message
              </label>
              <textarea
                placeholder="Décrivez-nous ce que vous avez remarqué ou ce que vous proposez..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setFocusedField("message")}
                onBlur={() => setFocusedField((prev) => (prev === "message" ? null : prev))}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none resize-none transition-all min-h-[132px]"
                style={{
                  ...getFieldStyle("message"),
                  willChange: "height",
                }}
              />
            </div>

            <div className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4" style={liquidPanelStyle}>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
                style={{
                  opacity: focusedField === "creatorUpdateMethod" || focusedField === "creatorUpdate" ? 1 : 0,
                  background: "linear-gradient(120deg, transparent 12%, color-mix(in srgb, var(--primary) 14%, transparent) 48%, transparent 82%)",
                }}
              />
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
                Recevoir un update (optionnel)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  value={creatorUpdateMethod}
                  onChange={(e) => {
                    const method = e.target.value as "" | "email" | "telegram"
                    setCreatorUpdateMethod(method)
                    if (!method) setCreatorUpdate("")
                  }}
                  onFocus={() => setFocusedField("creatorUpdateMethod")}
                  onBlur={() => setFocusedField((prev) => (prev === "creatorUpdateMethod" ? null : prev))}
                  className="sm:col-span-1 w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all min-h-[48px]"
                  style={getFieldStyle("creatorUpdateMethod")}
                >
                  <option value="">Aucun</option>
                  <option value="email">Courriel</option>
                  <option value="telegram">Telegram</option>
                </select>

                <input
                  type="text"
                  placeholder={
                    creatorUpdateMethod === "email"
                      ? "nom@exemple.com"
                      : creatorUpdateMethod === "telegram"
                        ? "@votrepseudo"
                        : "Choisissez d'abord le canal"
                  }
                  value={creatorUpdate}
                  onChange={(e) => setCreatorUpdate(e.target.value)}
                  onFocus={() => setFocusedField("creatorUpdate")}
                  onBlur={() => setFocusedField((prev) => (prev === "creatorUpdate" ? null : prev))}
                  disabled={!creatorUpdateMethod}
                  className="sm:col-span-2 w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all min-h-[48px] disabled:opacity-55"
                  style={getFieldStyle("creatorUpdate")}
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                Utilisez votre courriel ou votre identifiant Telegram pour etre notifie lors des mises a jour.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 82%, oklch(1 0 0 / 0.06)), var(--primary))",
                color: "var(--primary-foreground)",
                border: "1px solid color-mix(in srgb, var(--primary) 45%, transparent)",
                boxShadow: "0 12px 28px color-mix(in srgb, var(--primary) 36%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.3)",
              }}
            >
              <Send size={15} />
              {sending ? "Envoi en cours..." : "Envoyer"}
            </button>

            <p className="text-[10px] text-center" style={{ color: "var(--muted-foreground)", opacity: 0.72 }}>
              Votre feedback sera envoye directement a l&apos;equipe Milele.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
