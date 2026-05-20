'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ScrollText, Users, RefreshCcw } from 'lucide-react'
import { Header } from '@/components/header'
import { StatCard, Card } from '@/components/card'
import { LiquidMetalGold } from 'ui-lib'
import { API_BASE, GOLD } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

type LogEntry = { id: string; timestamp: string; type: string; env: string; data: Record<string, unknown> }
type Stats = { total?: number; byType?: Record<string, number>; types?: Record<string, number>; fileSizeBytes?: number }

export default function DashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (spinner = true) => {
    if (spinner) setLoading(true); else setRefreshing(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setLoading(false); setRefreshing(false); return }
    const res = await fetch(`${API_BASE}/api/staff/monark?limit=10&source=memory`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    if (res.ok) {
      const payload = await res.json()
      setLogs(payload.logs ?? [])
      setStats(payload.stats ?? null)
    }
    setLoading(false); setRefreshing(false)
  }, [])

  useEffect(() => { void fetchData(true) }, [fetchData])

  const counts = stats?.byType ?? stats?.types ?? {}
  const total = stats?.total ?? logs.length

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="Vue d'ensemble de l'activité Monark" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Événements" value={total}        icon={<Activity className="h-5 w-5" />} tone="gold"    delay={0} />
          <StatCard title="Erreurs"    value={counts.error ?? 0} icon={<AlertTriangle className="h-5 w-5" />} tone="rose"    delay={0.05} />
          <StatCard title="Auth"       value={counts.auth  ?? 0} icon={<Users className="h-5 w-5" />}         tone="sky"     delay={0.1} />
          <StatCard title="Requêtes"   value={counts.request ?? 0} icon={<ScrollText className="h-5 w-5" />}  tone="emerald" delay={0.15} />
        </div>

        {/* Recent logs */}
        <Card delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: GOLD.light }}>Logs récents</h2>
            <LiquidMetalGold
              label={refreshing ? 'Actualisation...' : 'Actualiser'}
              size="sm" variant="outline"
              leftIcon={<RefreshCcw className="h-3.5 w-3.5" />}
              onClick={() => void fetchData(false)}
              disabled={refreshing}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: GOLD.primary }} />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>Aucun log disponible.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <LogTypeBadge type={log.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--foreground)' }}>
                      {typeof log.data?.message === 'string' ? log.data.message : JSON.stringify(log.data).slice(0, 80)}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                      {formatDate(log.timestamp)} · {log.env}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function LogTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    error: '#fb7185', info: '#38bdf8', debug: '#fbbf24',
    request: '#34d399', response: '#818cf8', auth: '#e879f9',
  }
  const c = colors[type] || GOLD.primary
  return (
    <span className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: c + '18', color: c, border: `1px solid ${c}25` }}>
      {type}
    </span>
  )
}
