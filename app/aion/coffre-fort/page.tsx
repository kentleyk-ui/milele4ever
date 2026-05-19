"use client"

import { useState } from "react"
import { Plus, X, Lock, FileText, Shield, ExternalLink, Copy, Check } from "lucide-react"
import { useAionContent } from "@/hooks/useAionContent"
import ContentItemCard from "@/components/aion/ContentItemCard"
import VisibilitySelector from "@/components/aion/VisibilitySelector"
import EmptyState from "@/components/aion/EmptyState"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import type { ContentItem, VisibilityLevel } from "@/types/aion"

const DOC_TYPES = [
  { value: "testament", label: "Testament", icon: "📜" },
  { value: "assurance", label: "Assurance vie", icon: "🛡️" },
  { value: "compte", label: "Comptes bancaires", icon: "🏦" },
  { value: "acces", label: "Accès numériques", icon: "🔑" },
  { value: "propriete", label: "Propriétés", icon: "🏠" },
  { value: "autre", label: "Autre document", icon: "📄" },
]

export default function CoffreFortPage() {
  const { items, loading, createItem, updateItem, deleteItem } = useAionContent("coffre_fort")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [docType, setDocType] = useState("")
  const [docUrl, setDocUrl] = useState("")
  const [visibility, setVisibility] = useState<VisibilityLevel>("intime")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const resetForm = () => {
    setTitle(""); setBody(""); setDocType(""); setDocUrl(""); setVisibility("intime")
    setEditingId(null); setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    const metadata = docType ? { doc_type: docType, doc_url: docUrl || undefined } : { doc_url: docUrl || undefined }
    if (editingId) {
      await updateItem(editingId, { title, body, visibility, metadata })
    } else {
      await createItem({ content_type: "coffre_fort", title, body, visibility, metadata, media_urls: [], is_encrypted: true, tags: docType ? [docType] : [], sort_order: items.length })
    }
    setSaving(false)
    resetForm()
  }

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id); setTitle(item.title ?? ""); setBody(item.body ?? "")
    setDocType((item.metadata?.doc_type as string) ?? "")
    setDocUrl((item.metadata?.doc_url as string) ?? "")
    setVisibility(item.visibility)
    setShowForm(true)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
    </div>
  )

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, #F59E0B 15%, var(--card))" }}>🔐</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Coffre-Fort</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Documents importants protégés</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}>
            <Plus size={16} /><span className="hidden sm:inline">Ajouter</span>
          </button>
        )}
      </div>

      {/* Bannière sécurité */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6"
        style={{ background: "color-mix(in srgb, #F59E0B 8%, var(--card))", border: "1px solid color-mix(in srgb, #F59E0B 20%, transparent)" }}>
        <Shield size={14} style={{ color: "#F59E0B" }} />
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Vos documents sont chiffrés. Seul votre Cercle de Confiance y aura accès.
        </p>
      </div>

      {/* Formulaire */}
      <>
        {showForm && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-6 p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, #F59E0B 20%, var(--border))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {editingId ? "Modifier le document" : "Nouveau document"}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>

            {/* Type de document */}
            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Type de document</p>
              <div className="grid grid-cols-3 gap-2">
                {DOC_TYPES.map(dt => (
                  <button key={dt.value} type="button" onClick={() => setDocType(dt.value)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all active:scale-95 touch-manipulation"
                    style={{
                      border: `1.5px solid ${docType === dt.value ? "#F59E0B" : "var(--border)"}`,
                      background: docType === dt.value ? "color-mix(in srgb, #F59E0B 10%, var(--card))" : "var(--card)",
                      color: docType === dt.value ? "#F59E0B" : "var(--muted-foreground)",
                      minHeight: 60,
                    }}>
                    <span className="text-lg">{dt.icon}</span>
                    <span>{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du document…"
              className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Informations, instructions, notes importantes…"
              rows={4} className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />

            {/* URL du document */}
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Lien vers le document (optionnel)…"
                type="url" className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid color-mix(in srgb, #F59E0B 20%, var(--border))" }} />
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Visibilité</p>
              <VisibilitySelector value={visibility} onChange={setVisibility} />
            </div>
            <div className="flex justify-end">
              <LiquidMetalButton label={saving ? "Enregistrement…" : editingId ? "Modifier" : "Enregistrer"}
                width={160} height={44} fontSize={13} tinted onClick={handleSubmit} disabled={saving || !title.trim()} />
            </div>
          </div>
        )}
      </>

      {items.length === 0 && !showForm ? (
        <EmptyState icon="🔐" title="Coffre-fort vide" description="Ajoutez vos documents importants : testament, assurances, accès numériques."
          actionLabel="Ajouter un document" onAction={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const url = item.metadata?.doc_url as string | undefined
            return (
              <div key={item.id} className="relative">
                <ContentItemCard item={item} onEdit={handleEdit} onDelete={deleteItem} />
                {url && (
                  <div className="mx-1 mb-1 -mt-2 px-4 py-2.5 rounded-b-xl flex items-center gap-2"
                    style={{ background: "color-mix(in srgb, #F59E0B 8%, var(--card))", border: "1px solid color-mix(in srgb, #F59E0B 18%, var(--border))", borderTop: "none" }}>
                    <ExternalLink size={12} style={{ color: "#F59E0B", flexShrink: 0 }} />
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-xs truncate hover:underline"
                      style={{ color: "#F59E0B" }}>{url}</a>
                    <button onClick={() => { void navigator.clipboard.writeText(url); setCopiedId(item.id); setTimeout(() => setCopiedId(null), 1800) }}
                      className="flex-shrink-0 p-1 rounded-lg transition-all" title="Copier le lien"
                      style={{ color: copiedId === item.id ? "#10B981" : "var(--muted-foreground)" }}>
                      {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
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
