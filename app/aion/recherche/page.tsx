"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Search, X, BookOpen, PenLine, Image, ScrollText, Mail, Lock, Clock } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import type { ContentItem } from "@/types/aion"

const MODULE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; href: string }> = {
  journal:      { label: "Journal",      icon: PenLine,    color: "#8B5CF6", href: "/aion/journal" },
  mon_histoire: { label: "Mon Histoire", icon: BookOpen,   color: "#3B82F6", href: "/aion/mon-histoire" },
  souvenirs:    { label: "Souvenirs",    icon: Image,      color: "#EC4899", href: "/aion/souvenirs" },
  volontes:     { label: "Volontés",     icon: ScrollText, color: "#10B981", href: "/aion/volontes" },
  capsule:      { label: "Capsules",     icon: Mail,       color: "#06B6D4", href: "/aion/capsules" },
  coffre_fort:  { label: "Coffre-fort",  icon: Lock,       color: "#F59E0B", href: "/aion/coffre-fort" },
}

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return "aujourd'hui"
  if (d === 1) return "hier"
  if (d < 30) return `il y a ${d} j`
  const m = Math.floor(d / 30)
  return `il y a ${m} mois`
}

export default function RecherchePage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filterType, setFilterType] = useState("")

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from("aion_content")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(60)
    setResults((data ?? []) as ContentItem[])
    setLoading(false)
  }, [])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void doSearch(query)
  }

  const filtered = filterType ? results.filter(r => r.content_type === filterType) : results
  const typeCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.content_type] = (acc[r.content_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "color-mix(in srgb, var(--primary) 15%, var(--card))" }}>
          🔍
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Recherche</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Cherchez dans tous vos contenus Aïon</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
        style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 16%, var(--border))" }}>
        <Search size={16} style={{ color: "var(--primary)" }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Titre, texte, mot-clé…"
          autoFocus
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--foreground)" }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setSearched(false) }}>
            <X size={14} style={{ color: "var(--muted-foreground)" }} />
          </button>
        )}
        <button
          onClick={() => void doSearch(query)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          Chercher
        </button>
      </div>

      {/* Filtres par module */}
      {results.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button onClick={() => setFilterType("")}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: !filterType ? "var(--primary)" : "var(--card)", color: !filterType ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            Tous ({results.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = MODULE_CONFIG[type]
            if (!cfg) return null
            const Icon = cfg.icon
            return (
              <button key={type} onClick={() => setFilterType(filterType === type ? "" : type)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: filterType === type ? `color-mix(in srgb, ${cfg.color} 12%, var(--card))` : "var(--card)", color: filterType === type ? cfg.color : "var(--muted-foreground)", border: `1px solid ${filterType === type ? cfg.color : "var(--border)"}` }}>
                <Icon size={11} />
                {cfg.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : searched && filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Aucun résultat</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Essayez d&apos;autres mots-clés</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(item => {
            const cfg = MODULE_CONFIG[item.content_type]
            const Icon = cfg?.icon ?? Search
            const color = cfg?.color ?? "var(--primary)"
            const href = cfg?.href ?? "/aion"
            return (
              <Link key={item.id} href={href}
                className="flex items-start gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${color} 12%, var(--secondary))` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-semibold" style={{ color }}>{cfg?.label ?? item.content_type}</p>
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      <Clock size={9} />
                      {timeAgo(item.created_at)}
                    </div>
                  </div>
                  {item.title && (
                    <p className="text-sm font-semibold mb-0.5 truncate" style={{ color: "var(--foreground)" }}>{item.title}</p>
                  )}
                  {item.body && (
                    <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.body}</p>
                  )}
                  {(item.tags ?? []).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.tags!.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `color-mix(in srgb, ${color} 10%, var(--secondary))`, color }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Raccourcis si pas encore cherché */}
      {!searched && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
            Accès rapide
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODULE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon
              return (
                <Link key={key} href={cfg.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${cfg.color} 12%, var(--secondary))` }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{cfg.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
