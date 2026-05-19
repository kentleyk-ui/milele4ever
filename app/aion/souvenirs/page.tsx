"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, X, Image as ImageIcon, Tag, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { useAionContent } from "@/hooks/useAionContent"
import ContentItemCard from "@/components/aion/ContentItemCard"
import VisibilitySelector from "@/components/aion/VisibilitySelector"
import EmptyState from "@/components/aion/EmptyState"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import type { ContentItem, VisibilityLevel } from "@/types/aion"

export default function SouvenirsPage() {
  const { items, loading, createItem, updateItem, deleteItem } = useAionContent("souvenirs")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<VisibilityLevel>("famille")
  const [mediaUrls, setMediaUrls] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Tags
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [filterTag, setFilterTag] = useState("")

  // Lightbox
  const [lightboxUrls, setLightboxUrls] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const allTags = Array.from(new Set(items.flatMap(i => i.tags ?? [])))

  const resetForm = () => {
    setTitle(""); setBody(""); setVisibility("famille")
    setMediaUrls(""); setTags([]); setTagInput("")
    setEditingId(null); setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    const parsedUrls = mediaUrls.split(/\r?\n/).map(u => u.trim()).filter(u => /^https?:\/\//i.test(u)).slice(0, 8)
    if (editingId) {
      await updateItem(editingId, { title, body, visibility, media_urls: parsedUrls, tags })
    } else {
      await createItem({ content_type: "souvenirs", title, body, visibility, metadata: {}, media_urls: parsedUrls, is_encrypted: false, tags, sort_order: items.length })
    }
    setSaving(false)
    resetForm()
  }

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id); setTitle(item.title ?? ""); setBody(item.body ?? "")
    setVisibility(item.visibility)
    setMediaUrls((item.media_urls ?? []).join("\n"))
    setTags(item.tags ?? []); setTagInput("")
    setShowForm(true)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
    </div>
  )

  const filteredItems = filterTag ? items.filter(i => i.tags?.includes(filterTag)) : items

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, #EC4899 15%, var(--card))" }}>🖼️</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Souvenirs</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Photos, vidéos et souvenirs précieux</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {(["grid", "list"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="px-3 py-2 text-xs transition-all touch-manipulation"
                style={{ background: viewMode === mode ? "var(--secondary)" : "transparent", color: viewMode === mode ? "var(--primary)" : "var(--muted-foreground)", minHeight: 36 }}>
                {mode === "grid" ? "⊞" : "≡"}
              </button>
            ))}
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}>
              <Plus size={16} /><span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <>
        {showForm && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-6 p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, #EC4899 20%, var(--border))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {editingId ? "Modifier le souvenir" : "Nouveau souvenir"}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du souvenir…"
              className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Décrivez ce souvenir, le moment, les émotions, les personnes présentes…"
              rows={4} className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />

            {/* Médias — URLs (une par ligne) */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={13} style={{ color: "#EC4899" }} />
                <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Photos / vidéos (URLs, une par ligne)</p>
              </div>
              <textarea value={mediaUrls} onChange={e => setMediaUrls(e.target.value)}
                placeholder="https://example.com/photo.jpg\nhttps://example.com/video.mp4"
                rows={3} className="w-full px-4 py-3 rounded-xl text-xs outline-none resize-none font-mono"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid color-mix(in srgb, #EC4899 25%, var(--border))" }} />
            </div>

        {/* Champ Tags */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={13} style={{ color: "#EC4899" }} />
                <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                    style={{ background: "color-mix(in srgb, #EC4899 12%, var(--secondary))", color: "#EC4899" }}>
                    #{t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && tagInput.trim() && tags.length < 5) { e.preventDefault(); setTags(prev => [...new Set([...prev, tagInput.trim().toLowerCase()])]); setTagInput("") } }}
                placeholder="Ajouter un tag (Entrée)…" className="w-full px-4 py-2.5 rounded-xl text-xs outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid color-mix(in srgb, #EC4899 20%, var(--border))" }} />
            </div>

            <div className="mb-4">
              <VisibilitySelector value={visibility} onChange={setVisibility} />
            </div>
            <div className="flex justify-end">
              <LiquidMetalButton label={saving ? "Enregistrement…" : editingId ? "Modifier" : "Enregistrer"}
                width={160} height={44} fontSize={13} tinted onClick={handleSubmit} disabled={saving || !title.trim()} />
            </div>
          </div>
        )}
      </>

      {/* Filtres tags */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button onClick={() => setFilterTag("")} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: !filterTag ? "var(--primary)" : "var(--card)", color: !filterTag ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)", minHeight: 32 }}>
            Tous
          </button>
          {allTags.map(t => (
            <button key={t} onClick={() => setFilterTag(filterTag === t ? "" : t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: filterTag === t ? "color-mix(in srgb, #EC4899 12%, var(--card))" : "var(--card)", color: filterTag === t ? "#EC4899" : "var(--muted-foreground)", border: `1px solid ${filterTag === t ? "#EC4899" : "var(--border)"}`, minHeight: 32 }}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <EmptyState icon="🖼️" title="Aucun souvenir" description="Préservez vos photos, vidéos et moments précieux pour vos proches."
          actionLabel="Ajouter un souvenir" onAction={() => setShowForm(true)} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map(item => (
            <div key={item.id}>
              {(item.media_urls ?? []).length > 0 && (
                <button onClick={() => { setLightboxUrls(item.media_urls ?? []); setLightboxIndex(0) }}
                  className="w-full mb-2 rounded-xl overflow-hidden relative group">
                  <Image src={item.media_urls![0]} alt="Apercu du souvenir" width={640} height={360} loading="lazy" unoptimized className="w-full h-28 object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {item.media_urls!.length > 1 && (
                    <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.55)", color: "white" }}>+{item.media_urls!.length - 1}</span>
                  )}
                </button>
              )}
              <ContentItemCard item={item} onEdit={handleEdit} onDelete={deleteItem} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map(item => <ContentItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={deleteItem} />)}
        </div>
      )}

      {/* Lightbox */}
      <>
        {lightboxUrls.length > 0 && (
          <div className="animate-in fade-in duration-200 fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setLightboxUrls([])}>
            <button className="absolute top-4 right-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              onClick={e => { e.stopPropagation(); setLightboxUrls([]) }}>
              <X size={20} />
            </button>
            <img key={lightboxIndex}
              src={lightboxUrls[lightboxIndex]} alt="Image du souvenir en plein ecran"
              width={1600}
              height={1200}
              decoding="async"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()} />
            {lightboxUrls.length > 1 && (
              <>
                <button className="absolute left-4 p-3 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + lightboxUrls.length) % lightboxUrls.length) }}>
                  <ChevronLeft size={20} />
                </button>
                <button className="absolute right-4 p-3 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % lightboxUrls.length) }}>
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {lightboxUrls.map((_, i) => (
                    <button key={i} onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{ background: i === lightboxIndex ? "white" : "rgba(255,255,255,0.35)" }} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </>
    </div>
  )
}
