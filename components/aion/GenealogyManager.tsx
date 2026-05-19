"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GitBranch, Save, Users } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type GenealogyRelation = "parent" | "enfant" | "conjoint" | "frere-soeur" | "proche"

type CirclePerson = {
  id: string
  display_name: string | null
  email: string
}

type GenealogyNode = {
  relation: GenealogyRelation
  parentId: string | null
  notes?: string
}

type GenealogyMap = Record<string, GenealogyNode>

const RELATION_OPTIONS: Array<{ value: GenealogyRelation; label: string; color: string }> = [
  { value: "parent", label: "Parent", color: "#d97706" },
  { value: "enfant", label: "Enfant", color: "#2563eb" },
  { value: "conjoint", label: "Conjoint(e)", color: "#db2777" },
  { value: "frere-soeur", label: "Frere/Soeur", color: "#7c3aed" },
  { value: "proche", label: "Proche", color: "#0891b2" },
]

function getPersonLabel(person: CirclePerson) {
  return person.display_name?.trim() || person.email
}

function getDepth(personId: string, map: GenealogyMap, memo: Map<string, number>, visited = new Set<string>()) {
  if (memo.has(personId)) return memo.get(personId) ?? 0
  if (visited.has(personId)) return 0
  visited.add(personId)
  const parentId = map[personId]?.parentId
  if (!parentId || !map[parentId]) {
    memo.set(personId, 0)
    return 0
  }
  const depth = Math.min(5, getDepth(parentId, map, memo, visited) + 1)
  memo.set(personId, depth)
  return depth
}

export default function GenealogyManager({ members }: { members: CirclePerson[] }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [rawPrefs, setRawPrefs] = useState<Record<string, unknown>>({})
  const [genealogy, setGenealogy] = useState<GenealogyMap>({})
  const [profileExists, setProfileExists] = useState(true)

  const loadTree = useCallback(async () => {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("privacy_prefs")
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      setNotice("Impossible de charger l'arbre genealogique.")
      setLoading(false)
      return
    }

    if (!data) {
      setProfileExists(false)
      setRawPrefs({})
      setGenealogy({})
      setLoading(false)
      return
    }

    setProfileExists(true)
    const prefs = ((data as { privacy_prefs?: Record<string, unknown> | null }).privacy_prefs ?? {}) as Record<string, unknown>
    setRawPrefs(prefs)

    const rawTree = prefs.genealogy_tree
    if (rawTree && typeof rawTree === "object") {
      const next: GenealogyMap = {}
      for (const [key, value] of Object.entries(rawTree as Record<string, unknown>)) {
        if (!value || typeof value !== "object") continue
        const node = value as { relation?: unknown; parentId?: unknown; notes?: unknown }
        const relation = typeof node.relation === "string" ? node.relation : "proche"
        const isValidRelation = RELATION_OPTIONS.some((r) => r.value === relation)
        next[key] = {
          relation: (isValidRelation ? relation : "proche") as GenealogyRelation,
          parentId: typeof node.parentId === "string" && node.parentId ? node.parentId : null,
          notes: typeof node.notes === "string" ? node.notes : "",
        }
      }
      setGenealogy(next)
    } else {
      setGenealogy({})
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadTree()
  }, [loadTree])

  const updateNode = (memberId: string, patch: Partial<GenealogyNode>) => {
    setGenealogy((prev) => {
      const current = prev[memberId] ?? { relation: "proche" as GenealogyRelation, parentId: null, notes: "" }
      const parentId = patch.parentId !== undefined ? patch.parentId : current.parentId
      const safeParentId = parentId === memberId ? null : parentId
      return {
        ...prev,
        [memberId]: {
          ...current,
          ...patch,
          parentId: safeParentId,
        },
      }
    })
  }

  const saveTree = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return

    if (!profileExists) {
      setNotice("Configurez d'abord votre profil pour activer l'arbre genealogique.")
      return
    }

    setSaving(true)
    setNotice(null)

    const payload = {
      ...rawPrefs,
      genealogy_tree: genealogy,
    }

    const { error } = await supabase
      .from("profiles")
      .update({ privacy_prefs: payload })
      .eq("id", user.id)

    if (error) {
      setNotice("Sauvegarde impossible pour le moment.")
    } else {
      setRawPrefs(payload)
      setNotice("Arbre genealogique enregistre.")
    }

    setSaving(false)
  }

  const graphRows = useMemo(() => {
    const memo = new Map<string, number>()
    const rows = members.map((member) => {
      const node = genealogy[member.id] ?? { relation: "proche" as GenealogyRelation, parentId: null, notes: "" }
      const depth = getDepth(member.id, genealogy, memo)
      const relationMeta = RELATION_OPTIONS.find((item) => item.value === node.relation) ?? RELATION_OPTIONS[RELATION_OPTIONS.length - 1]
      return {
        id: member.id,
        label: getPersonLabel(member),
        relationLabel: relationMeta.label,
        relationColor: relationMeta.color,
        depth,
        parentId: node.parentId,
      }
    })

    return rows.sort((a, b) => a.depth - b.depth || a.label.localeCompare(b.label, "fr"))
  }, [genealogy, members])

  const columns = useMemo(() => {
    const grouped: Record<number, typeof graphRows> = {}
    for (const row of graphRows) {
      if (!grouped[row.depth]) grouped[row.depth] = []
      grouped[row.depth].push(row)
    }
    return Object.entries(grouped)
      .map(([depth, rows]) => ({ depth: Number(depth), rows }))
      .sort((a, b) => a.depth - b.depth)
  }, [graphRows])

  return (
    <section className="mb-6 rounded-2xl p-4 sm:p-5" style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            <GitBranch size={14} />
            Arbre genealogique
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Definissez les liens de votre cercle pour une transmission plus claire.
          </p>
        </div>
        <button
          onClick={() => void saveTree()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
          style={{
            color: "var(--primary)",
            background: "color-mix(in srgb, var(--primary) 11%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--primary) 26%, var(--border))",
          }}
        >
          <Save size={14} />
          {saving ? "Sauvegarde..." : "Enregistrer l'arbre"}
        </button>
      </div>

      {notice ? (
        <div className="mb-3 rounded-xl px-3 py-2 text-xs" style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))", color: "var(--foreground)", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))" }}>
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Chargement de l'arbre...</div>
      ) : members.length === 0 ? (
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Ajoutez d'abord des membres dans votre cercle pour construire l'arbre.</div>
      ) : (
        <>
          <div className="space-y-2 mb-5">
            {members.map((member) => {
              const node = genealogy[member.id] ?? { relation: "proche" as GenealogyRelation, parentId: null, notes: "" }
              return (
                <div key={member.id} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr] gap-2 rounded-xl p-2.5" style={{ border: "1px solid var(--border)", background: "color-mix(in srgb, var(--background) 65%, var(--card))" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{getPersonLabel(member)}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>{member.email}</p>
                  </div>

                  <select
                    value={node.relation}
                    onChange={(event) => updateNode(member.id, { relation: event.target.value as GenealogyRelation })}
                    className="px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    {RELATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <select
                    value={node.parentId ?? ""}
                    onChange={(event) => updateNode(member.id, { parentId: event.target.value || null })}
                    className="px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    <option value="">Racine</option>
                    {members.filter((candidate) => candidate.id !== member.id).map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>{getPersonLabel(candidate)}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl p-3" style={{ border: "1px solid var(--border)", background: "color-mix(in srgb, var(--background) 72%, var(--card))" }}>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
              <Users size={13} />
              Visualisation par generation
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {columns.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Aucune relation definie pour le moment.</p>
              ) : columns.map((column) => (
                <div key={column.depth} className="min-w-[170px] rounded-xl p-2" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                  <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>Generation {column.depth + 1}</p>
                  <div className="space-y-2">
                    {column.rows.map((row) => (
                      <div key={row.id} className="rounded-lg px-2 py-1.5" style={{ border: `1px solid color-mix(in srgb, ${row.relationColor} 28%, var(--border))`, background: `color-mix(in srgb, ${row.relationColor} 10%, var(--card))` }}>
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{row.label}</p>
                        <p className="text-[10px]" style={{ color: row.relationColor }}>{row.relationLabel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
