"use client"

import { useState } from "react"
import { Plus, X, PenLine, Calendar, Hash, Smile } from "lucide-react"
import { useAionContent } from "@/hooks/useAionContent"
import ContentItemCard from "@/components/aion/ContentItemCard"
import VisibilitySelector from "@/components/aion/VisibilitySelector"
import EmptyState from "@/components/aion/EmptyState"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { formatDate } from "@/lib/aion-dates"
import type { ContentItem, VisibilityLevel } from "@/types/aion"

export default function JournalPage() {
  const { items, loading, createItem, updateItem, deleteItem } = useAionContent("journal")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<VisibilityLevel>("intime")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Mood & tags
  const MOODS = [
    { emoji: "😊", label: "Serein" },
    { emoji: "🥰", label: "Heureux" },
    { emoji: "😔", label: "Triste" },
    { emoji: "🤔", label: "Pensif" },
    { emoji: "😐", label: "Neutre" },
  ]
  const [mood, setMood] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [filterMood, setFilterMood] = useState("")

  const today = formatDate(new Date().toISOString())

  const resetForm = () => {
    setTitle(""); setBody(""); setVisibility("intime")
    setMood(""); setTags([]); setTagInput("")
    setEditingId(null); setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!body.trim()) return
    setSaving(true)
    const entryTitle = title.trim() || today
    const meta = { date: new Date().toISOString(), mood: mood || undefined }
    if (editingId) {
      await updateItem(editingId, { title: entryTitle, body, visibility, metadata: meta, tags })
    } else {
      await createItem({ content_type: "journal", title: entryTitle, body, visibility, metadata: meta, media_urls: [], is_encrypted: false, tags, sort_order: items.length })
    }
    setSaving(false)
    resetForm()
  }

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id); setTitle(item.title ?? ""); setBody(item.body ?? "")
    setVisibility(item.visibility)
    setMood((item.metadata?.mood as string) ?? "")
    setTags(item.tags ?? [])
    setShowForm(true)
  }

  const filteredItems = filterMood ? items.filter(i => (i.metadata?.mood as string) === filterMood) : items

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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, #10B981 15%, var(--card))" }}>📝</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Journal Intime</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Vos pensées et réflexions</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}>
            <Plus size={16} /><span className="hidden sm:inline">Écrire</span>
          </button>
        )}
      </div>

      {/* Date + filtre humeurs */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={13} style={{ color: "var(--primary)" }} />
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{today}</p>
      </div>

      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button onClick={() => setFilterMood("")}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: !filterMood ? "var(--primary)" : "var(--card)", color: !filterMood ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)", minHeight: 32 }}>
            Tout
          </button>
          {MOODS.map(m => (
            <button key={m.emoji} onClick={() => setFilterMood(filterMood === m.emoji ? "" : m.emoji)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: filterMood === m.emoji ? "color-mix(in srgb, #10B981 12%, var(--card))" : "var(--card)", color: filterMood === m.emoji ? "#10B981" : "var(--muted-foreground)", border: `1px solid ${filterMood === m.emoji ? "#10B981" : "var(--border)"}`, minHeight: 32 }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Formulaire */}
      <>
        {showForm && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-6 p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, #10B981 20%, var(--border))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {editingId ? "Modifier l'entrée" : `Entrée du ${today}`}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`Titre (optionnel) — ${today}`}
              className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Comment vous sentez-vous aujourd'hui ? Qu'est-ce qui vous traverse l'esprit ?"
              rows={6} className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)", fontFamily: "Georgia, serif", lineHeight: 1.8 }} />

            {/* Sélecteur humeur */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                <Smile size={12} /> Humeur du moment
              </p>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button key={m.emoji} type="button" onClick={() => setMood(mood === m.emoji ? "" : m.emoji)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs transition-all active:scale-90"
                    style={{ background: mood === m.emoji ? "color-mix(in srgb, #10B981 12%, var(--card))" : "var(--secondary)", border: `1px solid ${mood === m.emoji ? "#10B981" : "var(--border)"}`, minWidth: 44 }}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[10px]" style={{ color: mood === m.emoji ? "#10B981" : "var(--muted-foreground)" }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                <Hash size={12} /> Tags (optionnel)
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: "color-mix(in srgb, var(--primary) 12%, var(--secondary))", color: "var(--primary)" }}>
                    #{t}
                    <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-red-400 transition-colors">×</button>
                  </span>
                ))}
              </div>
              {tags.length < 5 && (
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    onKeyDown={e => { if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) { e.preventDefault(); setTags([...tags, tagInput.trim()]); setTagInput("") } }}
                    placeholder="Ajouter un tag + Entrée"
                    className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Visibilité</p>
              <VisibilitySelector value={visibility} onChange={setVisibility} />
            </div>
            <div className="flex justify-end">
              <LiquidMetalButton label={saving ? "Enregistrement…" : editingId ? "Modifier" : "Enregistrer"}
                width={160} height={44} fontSize={13} tinted onClick={handleSubmit} disabled={saving || !body.trim()} />
            </div>
          </div>
        )}
      </>

      {items.length === 0 && !showForm ? (
        <EmptyState icon="📝" title="Votre journal vous attend" description="Exprimez vos pensées, vos émotions, vos réflexions du quotidien."
          actionLabel="Écrire une entrée" onAction={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map(item => (
            <div key={item.id}>
              {(item.metadata?.mood || (item.tags ?? []).length > 0) && (
                <div className="flex items-center gap-2 px-1 mb-1">
                  {item.metadata?.mood ? <span className="text-base">{item.metadata.mood as string}</span> : null}
                  {(item.tags ?? []).map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "color-mix(in srgb, var(--primary) 10%, var(--secondary))", color: "var(--primary)" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <ContentItemCard item={item} onEdit={handleEdit} onDelete={deleteItem} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
