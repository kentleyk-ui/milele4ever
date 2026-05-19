"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, RefreshCcw, Search, ShieldAlert, Trash2 } from "lucide-react"

import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { supabase } from "@/lib/supabaseClient"

type LogType = "error" | "info" | "debug" | "request" | "response" | "auth"

type MonarkLogEntry = {
  id: string
  timestamp: string
  type: LogType
  env: string
  data: Record<string, unknown>
}

type MonarkPayload = {
  ok: boolean
  count: number
  stats?: {
    total?: number
    byType?: Partial<Record<LogType, number>>
    types?: Partial<Record<LogType, number>>
    fileSizeBytes?: number
    oldest?: string
    newest?: string
  }
  logs: MonarkLogEntry[]
}

const TYPE_STYLES: Record<LogType, string> = {
  error: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  info: "bg-cyan-500/15 text-cyan-200 border-cyan-500/20",
  debug: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  request: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
  response: "bg-sky-500/15 text-sky-200 border-sky-500/20",
  auth: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/20",
}

function formatBytes(bytes: number | undefined) {
  if (!bytes) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function responseStatusCode(data: Record<string, unknown>) {
  const response = data.response
  if (!response || typeof response !== "object") return ""
  const maybeStatusCode = (response as { statusCode?: unknown }).statusCode
  return typeof maybeStatusCode === "number" || typeof maybeStatusCode === "string"
    ? String(maybeStatusCode)
    : ""
}

export default function MonarkLogsClient() {
  const router = useRouter()
  const [logs, setLogs] = useState<MonarkLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [purging, setPurging] = useState(false)
  const [clearingMemory, setClearingMemory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<"all" | LogType>("all")
  const [quickTab, setQuickTab] = useState<"all" | "auth401">("all")
  const [source, setSource] = useState<"memory" | "file">("memory")
  const [limit, setLimit] = useState(50)
  const [stats, setStats] = useState<MonarkPayload["stats"] | null>(null)
  const [search, setSearch] = useState("")

  const fetchLogs = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError("Session introuvable")
        return
      }

      const params = new URLSearchParams({
        limit: String(limit),
        source,
      })
      if (typeFilter !== "all") params.set("type", typeFilter)

      const res = await fetch(`/api/staff/monark?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })

      const payload = (await res.json().catch(() => ({}))) as Partial<MonarkPayload> & { error?: string }
      if (!res.ok) {
        setError(payload.error ?? "Impossible de charger les logs Monark")
        return
      }

      setLogs(payload.logs ?? [])
      setStats(payload.stats ?? null)
    } catch {
      setError("Erreur réseau lors du chargement des logs")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [limit, source, typeFilter])

  useEffect(() => {
    void fetchLogs(true)
  }, [fetchLogs])

  async function purgeFile() {
    setPurging(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError("Session introuvable")
        return
      }

      const res = await fetch("/api/staff/monark?target=file", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        setError(payload.error ?? "Impossible de purger le fichier")
        return
      }

      void fetchLogs(false)
    } catch {
      setError("Erreur réseau lors de la purge")
    } finally {
      setPurging(false)
    }
  }

  async function clearMemoryBuffer() {
    setClearingMemory(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError("Session introuvable")
        return
      }

      const res = await fetch("/api/staff/monark?target=memory", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        setError(payload.error ?? "Impossible de vider le buffer mémoire")
        return
      }

      void fetchLogs(false)
    } catch {
      setError("Erreur réseau lors du vidage mémoire")
    } finally {
      setClearingMemory(false)
    }
  }

  async function exportLogs(format: "csv" | "jsonl") {
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError("Session introuvable")
        return
      }

      const params = new URLSearchParams({
        source,
        limit: String(limit),
        format,
        download: "1",
      })
      if (typeFilter !== "all") params.set("type", typeFilter)

      const res = await fetch(`/api/staff/monark?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        setError(payload.error ?? `Impossible d'exporter en ${format.toUpperCase()}`)
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `monark-logs-${source}.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError(`Erreur réseau lors de l'export ${format.toUpperCase()}`)
    }
  }

  const countByType = useMemo(() => stats?.byType ?? stats?.types ?? {}, [stats])

  const filteredLogs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return logs.filter((log) => {
      const matchesQuickTab = quickTab === "auth401"
        ? log.type === "auth" || String(log.data?.message ?? "").includes("401") || responseStatusCode(log.data) === "401"
        : true

      if (!matchesQuickTab) return false
      if (!needle) return true

      const haystack = [
        log.type,
        log.env,
        log.timestamp,
        JSON.stringify(log.data),
      ].join(" ").toLowerCase()

      return haystack.includes(needle)
    })
  }, [logs, quickTab, search])

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8 pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Monark Logs</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Monitoring auth, erreurs 401, requêtes et réponses Monark.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LiquidMetalButton label="Retour admin" width={148} height={40} fontSize={12} tinted leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push("/admin")} />
          <LiquidMetalButton label={refreshing ? "Actualisation..." : "Actualiser"} width={142} height={40} fontSize={12} tinted leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => void fetchLogs(false)} disabled={refreshing} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 mb-6">
        <Stat title="Total mémoire" value={String(stats?.total ?? logs.length)} />
        <Stat title="Erreurs" value={String(countByType.error ?? 0)} tone="rose" />
        <Stat title="Auth" value={String(countByType.auth ?? 0)} tone="fuchsia" />
        <Stat title="Requêtes" value={String(countByType.request ?? 0)} tone="emerald" />
        <Stat title="Fichier" value={formatBytes(stats?.fileSizeBytes)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: "var(--secondary)" }}>
          <button
            type="button"
            onClick={() => setQuickTab("all")}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            style={{
              background: quickTab === "all" ? "var(--card)" : "transparent",
              color: quickTab === "all" ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setQuickTab("auth401")}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            style={{
              background: quickTab === "auth401" ? "rgba(232,121,249,0.15)" : "transparent",
              color: quickTab === "auth401" ? "#f0abfc" : "var(--muted-foreground)",
            }}
          >
            401 Auth
          </button>
        </div>
        <label className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Source
          <select className="ml-2 rounded-lg border px-2 py-1 text-sm bg-transparent" value={source} onChange={(e) => setSource(e.target.value as "memory" | "file")}>
            <option value="memory">Mémoire</option>
            <option value="file">Fichier</option>
          </select>
        </label>
        <label className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Type
          <select className="ml-2 rounded-lg border px-2 py-1 text-sm bg-transparent" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | LogType)}>
            <option value="all">Tous</option>
            <option value="auth">Auth</option>
            <option value="error">Error</option>
            <option value="request">Request</option>
            <option value="response">Response</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </label>
        <label className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Limite
          <select className="ml-2 rounded-lg border px-2 py-1 text-sm bg-transparent" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm min-w-[240px]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          <Search className="h-4 w-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche texte dans les logs..."
            className="w-full bg-transparent outline-none"
          />
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <LiquidMetalButton label="Export JSONL" width={138} height={38} fontSize={11} tinted leftIcon={<Download className="h-4 w-4" />} onClick={() => void exportLogs("jsonl")} />
          <LiquidMetalButton label="Export CSV" width={128} height={38} fontSize={11} tinted leftIcon={<Download className="h-4 w-4" />} onClick={() => void exportLogs("csv")} />
          <LiquidMetalButton label={clearingMemory ? "Vidage..." : "Vider mémoire"} width={138} height={38} fontSize={11} tinted leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => void clearMemoryBuffer()} disabled={clearingMemory || source !== "memory"} />
          <LiquidMetalButton label={purging ? "Purge..." : "Purger fichier"} width={142} height={38} fontSize={11} tinted leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => void purgeFile()} disabled={purging || source !== "file"} />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Événements récents</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{filteredLogs.length} résultat(s) affiché(s)</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-5 py-10 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>Aucun log à afficher.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredLogs.map((log) => (
              <div key={log.id} className="px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${TYPE_STYLES[log.type]}`}>{log.type}</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{new Date(log.timestamp).toLocaleString("fr-FR")}</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{log.env}</span>
                </div>
                <pre className="overflow-x-auto rounded-xl p-3 text-xs leading-6" style={{ background: "rgba(255,255,255,0.04)", color: "var(--foreground)" }}>
{JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ title, value, tone = "slate" }: { title: string; value: string; tone?: "slate" | "rose" | "fuchsia" | "emerald" }) {
  const color = tone === "rose" ? "#fb7185" : tone === "fuchsia" ? "#e879f9" : tone === "emerald" ? "#34d399" : "var(--foreground)"
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{title}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  )
}