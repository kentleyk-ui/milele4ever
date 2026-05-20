'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw, Search, ShieldAlert, Trash2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://www.milele4ever.com'

type LogType = 'error' | 'info' | 'debug' | 'request' | 'response' | 'auth'

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
  }
  logs: MonarkLogEntry[]
}

const TYPE_STYLES: Record<LogType, string> = {
  error: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  debug: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  request: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  response: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  auth: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20',
}

function formatBytes(bytes?: number) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Btn({ label, onClick, disabled, variant = 'default' }: { label: string; onClick: () => void; disabled?: boolean; variant?: 'default' | 'danger' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-40"
      style={{
        background: variant === 'danger' ? 'rgba(244,63,94,0.15)' : 'rgba(167,139,250,0.15)',
        color: variant === 'danger' ? '#fb7185' : '#c4b5fd',
        border: `1px solid ${variant === 'danger' ? 'rgba(244,63,94,0.2)' : 'rgba(167,139,250,0.2)'}`,
      }}
    >
      {label}
    </button>
  )
}

function Stat({ title, value, color }: { title: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{title}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: color || 'var(--foreground)' }}>{value}</div>
    </div>
  )
}

export default function MonarkConsole({ token }: { token: string }) {
  const [logs, setLogs] = useState<MonarkLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | LogType>('all')
  const [quickTab, setQuickTab] = useState<'all' | 'auth401'>('all')
  const [source, setSource] = useState<'memory' | 'file'>('memory')
  const [limit, setLimit] = useState(50)
  const [stats, setStats] = useState<MonarkPayload['stats'] | null>(null)
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(limit), source })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`${API_BASE}/api/staff/monark?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const payload = await res.json().catch(() => ({})) as Partial<MonarkPayload> & { error?: string }
      if (!res.ok) { setError(payload.error ?? 'Impossible de charger les logs'); return }
      setLogs(payload.logs ?? [])
      setStats(payload.stats ?? null)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [limit, source, typeFilter, token])

  useEffect(() => { void fetchLogs(true) }, [fetchLogs])

  async function deleteTarget(target: 'file' | 'memory') {
    const res = await fetch(`${API_BASE}/api/staff/monark?target=${target}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) void fetchLogs(false)
  }

  async function exportLogs(format: 'csv' | 'jsonl') {
    const params = new URLSearchParams({ source, limit: String(limit), format, download: '1' })
    if (typeFilter !== 'all') params.set('type', typeFilter)
    const res = await fetch(`${API_BASE}/api/staff/monark?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `monark-${source}.${format}`
    a.click(); URL.revokeObjectURL(url)
  }

  const countByType = useMemo(() => stats?.byType ?? stats?.types ?? {}, [stats])

  const filteredLogs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return logs.filter(log => {
      if (quickTab === 'auth401' && log.type !== 'auth') return false
      if (!needle) return true
      return [log.type, log.env, log.timestamp, JSON.stringify(log.data)].join(' ').toLowerCase().includes(needle)
    })
  }, [logs, quickTab, search])

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8 pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monark Logs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Monitoring auth, erreurs 401, requêtes et réponses.</p>
        </div>
        <div className="flex gap-2">
          <Btn label={refreshing ? 'Actualisation...' : 'Actualiser'} onClick={() => void fetchLogs(false)} disabled={refreshing} />
          <Btn label="Déconnexion" onClick={() => supabase.auth.signOut()} variant="danger" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat title="Total mémoire" value={String(stats?.total ?? logs.length)} />
        <Stat title="Erreurs" value={String(countByType.error ?? 0)} color="#fb7185" />
        <Stat title="Auth" value={String(countByType.auth ?? 0)} color="#e879f9" />
        <Stat title="Requêtes" value={String(countByType.request ?? 0)} color="#34d399" />
        <Stat title="Fichier" value={formatBytes(stats?.fileSizeBytes)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['all', 'auth401'] as const).map(tab => (
            <button key={tab} onClick={() => setQuickTab(tab)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              style={{ background: quickTab === tab ? 'var(--card)' : 'transparent', color: quickTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
              {tab === 'all' ? 'Tous' : '401 Auth'}
            </button>
          ))}
        </div>
        {[
          { label: 'Source', value: source, setter: setSource, options: [['memory', 'Mémoire'], ['file', 'Fichier']] },
          { label: 'Type', value: typeFilter, setter: setTypeFilter, options: [['all','Tous'],['auth','Auth'],['error','Error'],['request','Request'],['response','Response'],['info','Info'],['debug','Debug']] },
          { label: 'Limite', value: String(limit), setter: (v: string) => setLimit(Number(v)), options: [['25','25'],['50','50'],['100','100'],['200','200']] },
        ].map(({ label, value, setter, options }) => (
          <label key={label} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {label}
            <select className="ml-2 rounded-lg border bg-transparent px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              value={value} onChange={e => (setter as (v: string) => void)(e.target.value)}>
              {options.map(([v, l]) => <option key={v} value={v} style={{ background: '#111' }}>{l}</option>)}
            </select>
          </label>
        ))}
        <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm min-w-[200px]" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Search className="h-4 w-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche..." className="w-full bg-transparent outline-none" />
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn label="Export JSONL" onClick={() => void exportLogs('jsonl')} />
          <Btn label="Export CSV" onClick={() => void exportLogs('csv')} />
          <Btn label="Vider mémoire" onClick={() => void deleteTarget('memory')} variant="danger" />
          <Btn label="Purger fichier" onClick={() => void deleteTarget('file')} variant="danger" />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />{error}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold">Événements récents</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>{filteredLogs.length} résultat(s)</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-5 py-10 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>Aucun log à afficher.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filteredLogs.map(log => (
              <div key={log.id} className="px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${TYPE_STYLES[log.type]}`}>{log.type}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{log.env}</span>
                </div>
                <pre className="overflow-x-auto rounded-xl p-3 text-xs leading-6" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--foreground)' }}>
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
