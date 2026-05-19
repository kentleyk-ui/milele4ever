"use client"

import { useState, useEffect } from "react"
import { Plus, X, CheckCircle2, Circle, Trash2, Lock, Unlock, Shield } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import VisibilitySelector from "@/components/aion/VisibilitySelector"
import VisibilityBadge from "@/components/aion/VisibilityBadge"
import EmptyState from "@/components/aion/EmptyState"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import type { Volonte, VolonteCategory, VisibilityLevel } from "@/types/aion"

const CATEGORIES: { key: VolonteCategory; label: string; icon: string; color: string }[] = [
  { key: "funeraire", label: "Funéraire", icon: "🕊️", color: "#8B5CF6" },
  { key: "medical", label: "Médical", icon: "🏥", color: "#EF4444" },
  { key: "legal", label: "Légal", icon: "⚖️", color: "#F59E0B" },
  { key: "personnel", label: "Personnel", icon: "💌", color: "#10B981" },
  { key: "numerique", label: "Numérique", icon: "💻", color: "#3B82F6" },
]

export default function VolontesPage() {
  const [volontes, setVolontes] = useState<Volonte[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState<VolonteCategory | "all">("all")
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set())

  // Champs
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState<VolonteCategory>("funeraire")
  const [visibility, setVisibility] = useState<VisibilityLevel>("intime")

  const fetchVolontes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("volontes").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
    setVolontes((data as Volonte[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchVolontes() }, [])

  const resetForm = () => {
    setTitle(""); setBody(""); setCategory("funeraire"); setVisibility("intime"); setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from("volontes").insert({
      owner_id: user.id, title, body: body || null, category,
      visibility, attachments: [], is_locked: false, confirmed: false,
    })
    setSaving(false)
    resetForm()
    fetchVolontes()
  }

  const toggleConfirm = async (v: Volonte) => {
    await supabase.from("volontes").update({ confirmed: !v.confirmed }).eq("id", v.id)
    fetchVolontes()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("volontes").delete().eq("id", id)
    fetchVolontes()
  }

  const filtered = activeCategory === "all" ? volontes : volontes.filter(v => v.category === activeCategory)
  const confirmedCount = volontes.filter(v => v.confirmed).length

  const toggleLock = (id: string) => {
    setLockedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, #EF4444 15%, var(--card))" }}>📜</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Volontés</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Vos directives et dernières volontés</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 44 }}>
            <Plus size={16} /><span className="hidden sm:inline">Ajouter</span>
          </button>
        )}
      </div>

      {/* Filtre catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        <button onClick={() => setActiveCategory("all")}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all touch-manipulation"
          style={{ background: activeCategory === "all" ? "var(--primary)" : "var(--card)", color: activeCategory === "all" ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)", minHeight: 36 }}>
          Toutes
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all touch-manipulation"
            style={{
              background: activeCategory === cat.key ? `color-mix(in srgb, ${cat.color} 15%, var(--card))` : "var(--card)",
              color: activeCategory === cat.key ? cat.color : "var(--muted-foreground)",
              border: `1px solid ${activeCategory === cat.key ? `color-mix(in srgb, ${cat.color} 30%, transparent)` : "var(--border)"}`,
              minHeight: 36,
            }}>
            <span>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      <>
        {showForm && (
          <div className="animate-in slide-in-from-top-3 fade-in duration-200 mb-6 p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, #EF4444 20%, var(--border))" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Nouvelle volonté</h2>
              <button onClick={resetForm} className="p-1.5 rounded-lg touch-manipulation" style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>

            {/* Catégorie */}
            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Catégorie</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all active:scale-95 touch-manipulation"
                    style={{
                      border: `1.5px solid ${category === cat.key ? cat.color : "var(--border)"}`,
                      background: category === cat.key ? `color-mix(in srgb, ${cat.color} 10%, var(--card))` : "var(--card)",
                      color: category === cat.key ? cat.color : "var(--muted-foreground)",
                      minHeight: 60,
                    }}>
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de la volonté…"
              className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Décrivez vos souhaits avec précision…"
              rows={4} className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }} />

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Visibilité</p>
              <VisibilitySelector value={visibility} onChange={setVisibility} />
            </div>
            <div className="flex justify-end">
              <LiquidMetalButton label={saving ? "Enregistrement…" : "Enregistrer"}
                width={160} height={44} fontSize={13} tinted onClick={handleSubmit} disabled={saving || !title.trim()} />
            </div>
          </div>
        )}
      </>

      {/* Liste */}
      {filtered.length === 0 && !showForm ? (
        <EmptyState icon="📜" title="Aucune volonté" description="Enregistrez vos souhaits funéraires, médicaux, légaux et personnels."
          actionLabel="Ajouter une volonté" onAction={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(v => {
            const cat = CATEGORIES.find(c => c.key === v.category)
            return (
              <div key={v.id} className="p-4 rounded-2xl transition-all"
                style={{ background: "var(--card)", border: `1px solid ${v.confirmed ? `color-mix(in srgb, var(--primary) 25%, transparent)` : "var(--border)"}` }}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleConfirm(v)} className="flex-shrink-0 mt-0.5 touch-manipulation" style={{ minWidth: 24, minHeight: 24 }}>
                    {v.confirmed
                      ? <CheckCircle2 size={20} style={{ color: "var(--primary)" }} />
                      : <Circle size={20} style={{ color: "var(--muted-foreground)" }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {cat && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"
                          style={{ background: `color-mix(in srgb, ${cat.color} 12%, transparent)`, color: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                      )}
                      <VisibilityBadge level={v.visibility} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)", textDecoration: v.confirmed ? "line-through" : "none", opacity: v.confirmed ? 0.6 : 1 }}>
                      {v.title}
                    </p>
                    {v.body && <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{v.body}</p>}
                  </div>
                  <button onClick={() => toggleLock(v.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg touch-manipulation" title={lockedItems.has(v.id) ? "Déverrouiller" : "Verrouiller"}
                    style={{ color: lockedItems.has(v.id) ? "#F59E0B" : "var(--muted-foreground)" }}>
                    {lockedItems.has(v.id) ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button onClick={() => handleDelete(v.id)} disabled={lockedItems.has(v.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg touch-manipulation disabled:opacity-30"
                    style={{ color: "#EF4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
