"use client"

import { useState, useEffect } from "react"
import { useDossier } from "@/lib/dossier-context"
import { CheckCircle2, Circle, Clock, AlertTriangle, TrendingUp, Search, X, StickyNote, ChevronDown, ChevronUp } from "lucide-react"
import { redirect } from "next/navigation"

const phaseConfig = {
  "48h": { label: "48 heures", subtitle: "Les démarches urgentes", icon: AlertTriangle, color: "oklch(0.55 0.15 25)" },
  "1semaine": { label: "1 semaine", subtitle: "Les démarches importantes", icon: Clock, color: "oklch(0.55 0.12 80)" },
  "1mois": { label: "1 mois", subtitle: "Les démarches à planifier", icon: Clock, color: "var(--primary)" },
} as const

type Phase = keyof typeof phaseConfig

export default function ChecklistPage() {
  const { dossier, hasDossier, updateChecklist } = useDossier()
  const [activePhase, setActivePhase] = useState<Phase>("48h")
  const [searchQuery, setSearchQuery] = useState("")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedNote, setExpandedNote] = useState<string | null>(null)

  // Charger notes depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("milele_checklist_notes")
      if (saved) setNotes(JSON.parse(saved) as Record<string, string>)
    } catch { /* ignore */ }
  }, [])

  const saveNote = (id: string, text: string) => {
    const updated = { ...notes, [id]: text }
    setNotes(updated)
    try { localStorage.setItem("milele_checklist_notes", JSON.stringify(updated)) } catch { /* ignore */ }
  }

  if (!hasDossier || !dossier) redirect("/espace")

  const phases: Phase[] = ["48h", "1semaine", "1mois"]
  const items = dossier.checklist.filter(c => c.phase === activePhase)
  const filtered = searchQuery.trim()
    ? items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : items
  const doneCount = filtered.filter(c => c.done).length
  const urgentPending = dossier.checklist.filter(c => c.phase === "48h" && !c.done).length
  const totalAll = dossier.checklist.length
  const doneAll = dossier.checklist.filter(c => c.done).length
  const globalPct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          Checklist des démarches
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Pour {dossier.defunt.prenom} {dossier.defunt.nom}
        </p>
      </div>

      {/* Résumé global */}
      <div className="rounded-2xl p-5 mb-6 flex items-center gap-5"
        style={{
          background: "var(--card)",
          border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
          boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 8%, transparent)",
        }}>
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" style={{ stroke: "var(--secondary)" }} />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
              strokeDasharray={`${globalPct} ${100 - globalPct}`}
              strokeLinecap="round"
              style={{
                stroke: "var(--primary)",
                transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)",
              }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>{globalPct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: "var(--primary)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
              Progression globale
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            <span className="font-bold text-base">{doneAll}</span> sur <span className="font-bold text-base">{totalAll}</span> démarches complétées
          </p>
          <div className="flex gap-3 mt-2">
            {phases.map((phase) => {
              const pi = dossier.checklist.filter(c => c.phase === phase)
              const pd = pi.filter(c => c.done).length
              return (
                <div key={phase} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: phaseConfig[phase].color }} />
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{pd}/{pi.length}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Onglets phases */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {phases.map(phase => {
          const cfg = phaseConfig[phase]
          const phaseItems = dossier.checklist.filter(c => c.phase === phase)
          const phaseDone = phaseItems.filter(c => c.done).length
          const active = activePhase === phase
          const phasePct = phaseItems.length > 0 ? Math.round((phaseDone / phaseItems.length) * 100) : 0
          return (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background: active ? cfg.color : "var(--card)",
                color: active ? "#fff" : "var(--muted-foreground)",
                border: active ? "none" : "1px solid var(--border)",
                boxShadow: active ? `0 4px 16px color-mix(in srgb, ${cfg.color} 30%, transparent)` : "none",
              }}
            >
              <cfg.icon size={14} />
              {cfg.label}
              <span className="text-xs opacity-80 font-bold">{phasePct}%</span>
              {phase === "48h" && urgentPending > 0 && (
                <span className="ml-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: "#ef4444", color: "white", minWidth: 18, textAlign: "center" }}>
                  {urgentPending}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <Search size={14} style={{ color: "var(--muted-foreground)" }} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filtrer les démarches…" className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--foreground)" }} />
        {searchQuery && <button onClick={() => setSearchQuery("")}><X size={13} style={{ color: "var(--muted-foreground)" }} /></button>}
      </div>

      {/* Info phase */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: "var(--muted-foreground)" }}>{phaseConfig[activePhase].subtitle}</span>
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>{doneCount}/{filtered.length}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${filtered.length > 0 ? (doneCount / filtered.length) * 100 : 0}%`,
              background: phaseConfig[activePhase].color,
              boxShadow: `0 0 8px ${phaseConfig[activePhase].color}`,
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        {filtered.map(item => (
          <div key={item.id} className="rounded-2xl overflow-hidden"
            style={{ background: item.done ? "color-mix(in srgb, var(--primary) 6%, var(--card))" : "var(--card)", border: `1px solid ${item.done ? "color-mix(in srgb, var(--primary) 25%, var(--border))" : "var(--border)"}`}}>
            <button
              onClick={() => updateChecklist(item.id, !item.done)}
              className="w-full flex items-start gap-3 p-4 text-left transition-all hover:scale-[1.003] active:scale-[0.997]"
              style={{ opacity: item.done ? 0.75 : 1 }}
            >
              {item.done ? (
                <CheckCircle2 size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
              ) : (
                <Circle size={20} style={{ color: "var(--border)", flexShrink: 0, marginTop: 1 }} />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "line-through" : ""}`} style={{ color: "var(--foreground)" }}>
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: item.done ? "color-mix(in srgb, var(--primary) 15%, var(--secondary))" : "var(--secondary)", color: item.done ? "var(--primary)" : "var(--muted-foreground)" }}>
                    {item.category}
                  </span>
                  {notes[item.id] && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #F59E0B 12%, var(--secondary))", color: "#F59E0B" }}>📝 Note</span>
                  )}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setExpandedNote(expandedNote === item.id ? null : item.id) }}
                className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                style={{ color: notes[item.id] ? "#F59E0B" : "var(--muted-foreground)", background: "transparent" }}>
                <StickyNote size={14} />
              </button>
            </button>
            {/* Zone note expandable */}
            {expandedNote === item.id && (
              <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
                <textarea
                  value={notes[item.id] ?? ""}
                  onChange={e => saveNote(item.id, e.target.value)}
                  placeholder="Ajouter une note pour cette démarche…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
                  style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid color-mix(in srgb, #F59E0B 25%, var(--border))" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
