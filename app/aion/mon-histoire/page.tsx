"use client"

import { useState } from "react"
import { Plus, X, Save, BookOpen, BookMarked } from "lucide-react"
import { useAionContent } from "@/hooks/useAionContent"
import ContentItemCard from "@/components/aion/ContentItemCard"
import VisibilitySelector from "@/components/aion/VisibilitySelector"
import EmptyState from "@/components/aion/EmptyState"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import type { ContentItem, VisibilityLevel } from "@/types/aion"

export default function MonHistoirePage() {
  const { items, loading, createItem, updateItem, deleteItem } = useAionContent("mon_histoire")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<VisibilityLevel>("intime")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const CHAPTERS = [
    { key: "enfance",  label: "Enfance",    emoji: "🌱", color: "#10B981" },
    { key: "jeunesse", label: "Jeunesse",   emoji: "⚡",     color: "#3B82F6" },
    { key: "amour",    label: "Amour",      emoji: "❤️",    color: "#EF4444" },
    { key: "famille",  label: "Famille",    emoji: "🏠",   color: "#F59E0B" },
    { key: "travail",  label: "Travail",    emoji: "💼",   color: "#8B5CF6" },
    { key: "voyage",   label: "Voyages",    emoji: "✈️",    color: "#06B6D4" },
    { key: "valeurs",  label: "Valeurs",    emoji: "✨",    color: "#A855F7" },
    { key: "autre",    label: "Autre",      emoji: "📝",   color: "var(--primary)" },
  ]
  const [chapter, setChapter] = useState("")
  const [filterChapter, setFilterChapter] = useState("")

  const resetForm = () => {
    setTitle(""); setBody(""); setVisibility("intime")
    setChapter(""); setEditingId(null); setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    if (editingId) {
      await updateItem(editingId, { title, body, visibility, tags: chapter ? [chapter] : [] })
    } else {
      await createItem({ content_type: "mon_histoire", title, body, visibility, metadata: {}, media_urls: [], is_encrypted: false, tags: chapter ? [chapter] : [], sort_order: items.length })
    }
    setSaving(false)
    resetForm()
  }

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id); setTitle(item.title ?? ""); setBody(item.body ?? "")
    setVisibility(item.visibility)
    setChapter(item.tags?.[0] ?? "")
    setShowForm(true)
  }

  const filteredItems = filterChapter ? items.filter(i => i.tags?.includes(filterChapter)) : items

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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, #8B5CF6 15%, var(--card))" }}>
            📖
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Mon Histoire</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Votre récit de vie, vos origines, vos valeurs</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        )}
      </div>

      {/* Filtres chapitres */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button onClick={() => setFilterChapter("")}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: !filterChapter ? "var(--primary)" : "var(--card)", color: !filterChapter ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)", minHeight: 32 }}>
            Tout
          </button>
          {CHAPTERS.map(ch => (
            <button key={ch.key} onClick={() => setFilterChapter(filterChapter === ch.key ? "" : ch.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: filterChapter === ch.key ? `color-mix(in srgb, ${ch.color} 12%, var(--card))` : "var(--card)", color: filterChapter === ch.key ? ch.color : "var(--muted-foreground)", border: `1px solid ${filterChapter === ch.key ? ch.color : "var(--border)"}`, minHeight: 32 }}>
              {ch.emoji} {ch.label}
            </button>
          ))}
        </div>
      )}

      {/* Formulaire */}
      <>
        {showForm && (
          <div className="mb-6 p-5 rounded-2xl animate-in slide-in-from-top-3 fade-in duration-200"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {editingId ? "Modifier" : "Nouveau chapitre"}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}>
                <X size={16} />
              </button>
            </div>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre du chapitre…"
              className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            />

            {/* Catégorie chapitre */}
            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Chapitre</p>
              <div className="grid grid-cols-4 gap-2">
                {CHAPTERS.map(ch => (
                  <button key={ch.key} type="button" onClick={() => setChapter(chapter === ch.key ? "" : ch.key)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all active:scale-95 touch-manipulation"
                    style={{ border: `1.5px solid ${chapter === ch.key ? ch.color : "var(--border)"}`, background: chapter === ch.key ? `color-mix(in srgb, ${ch.color} 10%, var(--card))` : "var(--card)", color: chapter === ch.key ? ch.color : "var(--muted-foreground)", minHeight: 56 }}>
                    <span className="text-lg">{ch.emoji}</span>
                    <span className="text-[10px]">{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Racontez votre histoire…"
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            />

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Visibilité</p>
              <VisibilitySelector value={visibility} onChange={setVisibility} />
            </div>

            <div className="flex justify-end">
              <LiquidMetalButton
                label={saving ? "Enregistrement…" : editingId ? "Modifier" : "Enregistrer"}
                width={160}
                height={44}
                fontSize={13}
                tinted
                onClick={handleSubmit}
                disabled={saving || !title.trim()}
              />
            </div>
          </div>
        )}
      </>

      {/* Liste */}
      {items.length === 0 && !showForm ? (
        <EmptyState
          icon="📖"
          title="Votre histoire commence ici"
          description="Écrivez les chapitres de votre vie, vos souvenirs, vos valeurs."
          actionLabel="Commencer mon histoire"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="relative">
          {/* Ligne verticale timeline */}
          {filteredItems.length > 1 && (
            <div className="absolute left-5 top-6 bottom-6 w-px" style={{ background: "color-mix(in srgb, var(--primary) 20%, var(--border))" }} />
          )}
          <div className="flex flex-col gap-4">
            {filteredItems.map((item, i) => {
              const ch = CHAPTERS.find(c => item.tags?.includes(c.key))
              return (
                <div key={item.id} className="flex gap-4 items-start">
                  {/* Dot timeline */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm z-10"
                    style={{ background: ch ? `color-mix(in srgb, ${ch.color} 15%, var(--card))` : "var(--card)", border: `2px solid ${ch ? ch.color : "var(--border)"}` }}>
                    {ch ? ch.emoji : <BookMarked size={14} style={{ color: "var(--primary)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {ch && (
                      <p className="text-[11px] font-semibold mb-1" style={{ color: ch.color }}>{ch.label}</p>
                    )}
                    <ContentItemCard item={item} onEdit={handleEdit} onDelete={deleteItem} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
