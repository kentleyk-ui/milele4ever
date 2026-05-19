"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, RefreshCcw, Database, Clock, ChevronDown, ChevronUp } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type MonitorCheck = {
  url: string
  statusCode: number
  result: string
  timestamp: string
}

type MonitorRun = {
  runId: string
  timestamp: string
  total: number
  failed: number
  status: string
  checks?: MonitorCheck[]
}

type DeploymentEntry = {
  id: number
  type: string
  title: string
  details: string
  date: string
  status: string
  note?: string
}

type ScriptsPayload = {
  ok: boolean
  refreshedAt: string
  data: {
    monitorLast: MonitorRun | null
    monitorHistory: MonitorRun[]
    monitorExcelCsv: string | null
    excelPushState: Record<string, unknown> | null
    smartsheetPushState: Record<string, unknown> | null
    feedbackDeployments: DeploymentEntry[] | null
    tasksText: string | null
    processesText: string | null
    scriptsList: string[]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

function fmtDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  } catch {
    return iso
  }
}

// ─── Network Topology ─────────────────────────────────────────────────────────

type NetNode = {
  id: string
  x: number
  y: number
  label: string
  icon: string
  status: "ok" | "warn" | "error" | "idle"
  kind: "cloud" | "cdn" | "server" | "router" | "modem" | "terminal" | "page"
}

type NetChannel = "http" | "api" | "db"

type NetEdge = {
  from: string
  to: string
  animated?: boolean
  lift?: number
  channels?: NetChannel[]
}

const NODE_COLORS: Record<string, string> = {
  ok: "#22c55e",
  warn: "#f59e0b",
  error: "#ef4444",
  idle: "#64748b",
}

const KIND_BG: Record<string, string> = {
  cloud:    "rgba(56,189,248,0.18)",
  cdn:      "rgba(139,92,246,0.18)",
  server:   "rgba(99,102,241,0.18)",
  router:   "rgba(236,72,153,0.18)",
  modem:    "rgba(245,158,11,0.18)",
  terminal: "rgba(20,184,166,0.18)",
  page:     "rgba(148,163,184,0.12)",
}

const CHANNEL_COLORS: Record<NetChannel, string> = {
  http: "#38bdf8",
  api: "#a78bfa",
  db: "#34d399",
}

// Icons SVG inline par kind
function NodeIcon({ kind, size = 22 }: { kind: string; size?: number }) {
  const s = size
  switch (kind) {
    case "cloud": return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M17 18H7a5 5 0 010-10 5 5 0 019.9-1A4 4 0 1117 18z" fill="currentColor" opacity={0.9}/>
      </svg>
    )
    case "cdn": return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="4" rx="2" fill="currentColor" opacity={0.8}/>
        <rect x="3" y="12" width="18" height="4" rx="2" fill="currentColor" opacity={0.6}/>
        <circle cx="7" cy="8" r="1.2" fill="white" opacity={0.9}/>
        <circle cx="7" cy="14" r="1.2" fill="white" opacity={0.9}/>
      </svg>
    )
    case "server": return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="5" rx="1.5" fill="currentColor" opacity={0.8}/>
        <rect x="4" y="10" width="16" height="5" rx="1.5" fill="currentColor" opacity={0.6}/>
        <rect x="4" y="17" width="16" height="4" rx="1.5" fill="currentColor" opacity={0.4}/>
        <circle cx="8" cy="5.5" r="1" fill="white" opacity={0.8}/>
        <circle cx="8" cy="12.5" r="1" fill="white" opacity={0.8}/>
      </svg>
    )
    case "router": return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="10" width="18" height="7" rx="2" fill="currentColor" opacity={0.75}/>
        <line x1="7" y1="10" x2="5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.6}/>
        <line x1="12" y1="10" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.8}/>
        <line x1="17" y1="10" x2="19" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.6}/>
        <circle cx="12" cy="13.5" r="1.5" fill="white" opacity={0.9}/>
      </svg>
    )
    case "modem": return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="9" width="14" height="9" rx="2" fill="currentColor" opacity={0.75}/>
        <path d="M8 7c0-2.2 8-2.2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.6}/>
        <path d="M10 7c0-1 4-1 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity={0.5}/>
        <circle cx="9" cy="13.5" r="1" fill="white" opacity={0.9}/>
        <circle cx="12" cy="13.5" r="1" fill="white" opacity={0.7}/>
        <circle cx="15" cy="13.5" r="1" fill="white" opacity={0.5}/>
      </svg>
    )
    case "terminal": return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="14" rx="2" fill="currentColor" opacity={0.7}/>
        <path d="M7 9l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="13" y1="15" x2="17" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.7}/>
      </svg>
    )
    default: return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="13" rx="2" fill="currentColor" opacity={0.7}/>
        <line x1="9" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.5}/>
        <circle cx="12" cy="11.5" r="3" fill="white" opacity={0.25}/>
      </svg>
    )
  }
}

function makeCurvePath(x1: number, y1: number, x2: number, y2: number, lift = 0) {
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2 - lift
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

function hashUrl(url: string) {
  let h = 0
  for (let i = 0; i < url.length; i++) h = ((h << 5) - h + url.charCodeAt(i)) | 0
  return Math.abs(h)
}

function latencyColor(ms: number) {
  if (ms <= 120) return "#22c55e"
  if (ms <= 180) return "#84cc16"
  if (ms <= 240) return "#f59e0b"
  return "#ef4444"
}

function AnimatedParticle({
  path,
  dur,
  color,
  delay,
  radius = 2.8,
}: {
  path: string
  dur: number
  color: string
  delay: number
  radius?: number
}) {
  return (
    <g>
      <circle r={radius} fill={color} opacity="0.9" filter="url(#packet-glow)">
        <animateMotion path={path} dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} rotate="auto" />
        <animate attributeName="opacity" values="0.1;1;0.1" dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} />
      </circle>
      <circle r={radius + 2.4} fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1">
        <animateMotion path={path} dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} rotate="auto" />
        <animate attributeName="r" values={`${radius + 0.6};${radius + 3.4};${radius + 0.6}`} dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} />
      </circle>
    </g>
  )
}

function NetworkTopology({ urlStats, lastStatusOk, totalRuns }: {
  urlStats: Record<string, { ok: number; fail: number }>
  lastStatusOk: boolean
  totalRuns: number
}) {
  const W = 920
  const H = 470
  const cx = W / 2

  const pageKeys = Object.keys(urlStats)
  const MAX_VISIBLE_ROUTES = 8
  const visibleRouteKeys = pageKeys.slice(0, MAX_VISIBLE_ROUTES)
  const hiddenRouteCount = Math.max(0, pageKeys.length - visibleRouteKeys.length)
  const routeLabels = visibleRouteKeys.length > 0
    ? [
        ...visibleRouteKeys,
        ...(hiddenRouteCount > 0 ? [`+${hiddenRouteCount} routes`] : []),
      ]
    : ["/", "/espace", "/services", "/aion", "/api/..."]

  const pageCols = Math.min(4, Math.max(2, Math.ceil(routeLabels.length / 2)))
  const pageGapX = 170
  const pageTopY = H - 140
  const pageBottomY = H - 76

  const pageNodes: NetNode[] = routeLabels.length > 0
    ? routeLabels.map((label, i) => {
        const isOverflow = label.startsWith("+")
        const stat = isOverflow ? null : urlStats[label]
        const pct = stat ? ((stat.ok + stat.fail) > 0 ? stat.ok / (stat.ok + stat.fail) : 1) : 0.95
        const status: NetNode["status"] = pct === 1 ? "ok" : pct >= 0.95 ? "warn" : "error"

        const row = Math.floor(i / pageCols)
        const col = i % pageCols
        const rowCount = Math.min(pageCols, routeLabels.length - row * pageCols)
        const startX = cx - ((rowCount - 1) * pageGapX) / 2

        return {
          id: `page-${i}`,
          x: startX + col * pageGapX,
          y: row === 0 ? pageTopY : pageBottomY,
          label,
          icon: "page",
          status,
          kind: "page",
        }
      })
    : [
        { id: "page-0", x: cx - 280, y: H - 74, label: "/", icon: "page", status: "idle" as const, kind: "page" as const },
        { id: "page-1", x: cx - 155, y: H - 108, label: "/espace", icon: "page", status: "idle" as const, kind: "page" as const },
        { id: "page-2", x: cx, y: H - 122, label: "/services", icon: "page", status: "idle" as const, kind: "page" as const },
        { id: "page-3", x: cx + 155, y: H - 108, label: "/aion", icon: "page", status: "idle" as const, kind: "page" as const },
        { id: "page-4", x: cx + 280, y: H - 74, label: "/api/...", icon: "page", status: "idle" as const, kind: "page" as const },
      ]

  const nodes: NetNode[] = [
    { id: "cloud", x: cx, y: 58, label: "Internet", icon: "cloud", status: "ok", kind: "cloud" },
    { id: "modem", x: cx - 210, y: 65, label: "Modem/ISP", icon: "modem", status: "ok", kind: "modem" },
    { id: "cdn", x: cx + 210, y: 65, label: "Vercel CDN", icon: "cdn", status: "ok", kind: "cdn" },
    { id: "server", x: cx, y: 178, label: "Serveur app", icon: "server", status: lastStatusOk ? "ok" : "error", kind: "server" },
    { id: "router", x: cx - 136, y: 292, label: "Load balancer", icon: "router", status: lastStatusOk ? "ok" : "warn", kind: "router" },
    { id: "terminal", x: cx + 136, y: 292, label: "Admin", icon: "terminal", status: "ok", kind: "terminal" },
    ...pageNodes,
  ]

  const edges: NetEdge[] = [
    { from: "modem", to: "cloud", animated: true, lift: 22, channels: ["http"] },
    { from: "cloud", to: "cdn", animated: true, lift: 24, channels: ["http", "api"] },
    { from: "cdn", to: "server", animated: true, lift: 14, channels: ["http", "api", "db"] },
    { from: "cloud", to: "server", animated: false, lift: 6, channels: ["api"] },
    { from: "server", to: "router", animated: true, lift: 14, channels: ["http", "api", "db"] },
    { from: "server", to: "terminal", animated: true, lift: 14, channels: ["api"] },
    ...pageNodes.map<NetEdge>((p, index) => ({ from: "router", to: p.id, animated: true, lift: 30 + (index % 3) * 7, channels: ["http", "api"] })),
  ]

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const failCount = Object.values(urlStats).reduce((acc, row) => acc + row.fail, 0)
  const linkHealth = failCount === 0 ? "Flux stable" : failCount < 3 ? "Flux degrade" : "Instable"

  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const latencyHeat = useMemo(() => {
    const rows = Object.entries(urlStats).map(([url, stat]) => {
      const total = stat.ok + stat.fail
      const failRate = total > 0 ? stat.fail / total : 0
      const seed = hashUrl(url)
      const jitter = seed % 38
      const latencyMs = Math.round(88 + failRate * 210 + jitter)
      return { url, latencyMs, failRate }
    })
    return rows.sort((a, b) => b.latencyMs - a.latencyMs).slice(0, 10)
  }, [urlStats])

  const multiChannelLegend: Array<{ key: NetChannel; label: string }> = [
    { key: "http", label: "HTTP" },
    { key: "api", label: "API" },
    { key: "db", label: "DB" },
  ]

  const panelTransform = `perspective(1300px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, rgba(56,189,248,0.12), transparent 45%), radial-gradient(circle at 85% 15%, rgba(168,85,247,0.1), transparent 44%), linear-gradient(140deg, #080d18 0%, #0b1223 46%, #0b152a 100%)",
        border: "1px solid rgba(56,189,248,0.25)",
        boxShadow: "0 22px 55px rgba(2,6,23,0.55), inset 0 1px 0 rgba(148,163,184,0.08)",
        transform: panelTransform,
        transition: "transform 120ms ease-out",
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        setTilt({ x: (0.5 - py) * 6.5, y: (px - 0.5) * 9 })
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Topologie reseau temps reel
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
            {totalRuns > 0 ? `${totalRuns} runs monitor | ${linkHealth}` : "En attente du premier run"}
          </p>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-full" style={{ color: "#d1fae5", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.35)" }}>UPLINK OK</span>
          <span className="px-2 py-1 rounded-full" style={{ color: "#dbeafe", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)" }}>PACKETS LIVE</span>
          <span className="px-2 py-1 rounded-full" style={{ color: "#f5f3ff", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)" }}>3-CHANNEL FLOW</span>
        </div>
      </div>

      <div className="px-5 pb-2 flex flex-wrap items-center gap-2 text-[10px]" style={{ color: "#94a3b8" }}>
        {multiChannelLegend.map((ch) => (
          <span key={ch.key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ border: `1px solid ${CHANNEL_COLORS[ch.key]}55`, background: `${CHANNEL_COLORS[ch.key]}18`, color: "#e2e8f0" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: CHANNEL_COLORS[ch.key] }} />
            {ch.label}
          </span>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxHeight: 470 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="netgrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="1" />
          </pattern>
          <pattern id="netgrid-fine" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgba(148,163,184,0.06)" />
          </pattern>

          <filter id="packet-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="edge-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="node-shadow" x="-60%" y="-60%" width="250%" height="250%">
            <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="rgba(2,6,23,0.7)" />
          </filter>

          <linearGradient id="node-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.35)" />
          </linearGradient>

          <radialGradient id="server-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(125,211,252,0.55)" />
            <stop offset="70%" stopColor="rgba(56,189,248,0.16)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#netgrid)" />
        <rect width={W} height={H} fill="url(#netgrid-fine)" opacity="0.6" />

        <ellipse cx={cx} cy={H - 42} rx="355" ry="70" fill="rgba(15,23,42,0.55)" />

        <g>
          {[1, 2, 3, 4].map((i) => (
            <circle key={i} cx={nodeMap.server.x} cy={nodeMap.server.y} r={22 + i * 26} fill="none" stroke="rgba(56,189,248,0.13)" strokeWidth="1">
              <animate attributeName="r" values={`${22 + i * 26};${34 + i * 26}`} dur={`${2.3 + i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0" dur={`${2.3 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <circle cx={nodeMap.server.x} cy={nodeMap.server.y} r="62" fill="url(#server-core)" />
          <circle cx={nodeMap.server.x} cy={nodeMap.server.y} r="40" fill="none" stroke="rgba(125,211,252,0.34)" strokeWidth="1.2">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${nodeMap.server.x} ${nodeMap.server.y}`} to={`360 ${nodeMap.server.x} ${nodeMap.server.y}`} dur="14s" repeatCount="indefinite" />
          </circle>
          <circle cx={nodeMap.server.x} cy={nodeMap.server.y} r="30" fill="none" stroke="rgba(34,211,238,0.32)" strokeWidth="1" strokeDasharray="5 6">
            <animateTransform attributeName="transform" type="rotate" from={`360 ${nodeMap.server.x} ${nodeMap.server.y}`} to={`0 ${nodeMap.server.x} ${nodeMap.server.y}`} dur="11s" repeatCount="indefinite" />
          </circle>
        </g>

        {edges.map((edge, edgeIndex) => {
          const from = nodeMap[edge.from]
          const to = nodeMap[edge.to]
          if (!from || !to) return null
          const isErr = from.status === "error" || to.status === "error"
          const channels = edge.channels ?? ["http"]
          const mainPath = makeCurvePath(from.x, from.y, to.x, to.y, edge.lift ?? 0)
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <path d={mainPath} fill="none" stroke="rgba(15,23,42,0.92)" strokeWidth={isErr ? 7 : 6} strokeLinecap="round" />
              {channels.map((ch, channelIndex) => {
                const offsetLift = (edge.lift ?? 0) + (channelIndex - (channels.length - 1) / 2) * 8
                const channelPath = makeCurvePath(from.x, from.y, to.x, to.y, offsetLift)
                const baseColor = isErr ? "#ef4444" : CHANNEL_COLORS[ch]
                return (
                  <g key={ch}>
                    <path
                      d={channelPath}
                      fill="none"
                      stroke={baseColor}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeDasharray={isErr ? "6 5" : "none"}
                      strokeOpacity={0.7}
                      filter="url(#edge-glow)"
                    />
                    {edge.animated && (
                      <>
                        <AnimatedParticle
                          path={channelPath}
                          dur={1.25 + ((edgeIndex + channelIndex) % 4) * 0.3}
                          color={baseColor}
                          delay={(edgeIndex * 0.18 + channelIndex * 0.21) % 2.4}
                          radius={2.4}
                        />
                        <AnimatedParticle
                          path={channelPath}
                          dur={1.8 + ((edgeIndex + channelIndex) % 3) * 0.35}
                          color={channelIndex % 2 === 0 ? "#e2e8f0" : baseColor}
                          delay={0.65 + (edgeIndex * 0.11 + channelIndex * 0.17) % 1.9}
                          radius={1.8}
                        />
                      </>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {nodes.map((node, idx) => {
          const col = NODE_COLORS[node.status]
          const bg = KIND_BG[node.kind]
          const isMainNode = ["cloud", "server", "cdn"].includes(node.kind)
          const boxW = node.kind === "page" ? 64 : 86
          const boxH = node.kind === "page" ? 50 : 68
          const tx = node.x - boxW / 2
          const ty = node.y - boxH / 2
          return (
            <g key={node.id} transform={`translate(${tx}, ${ty})`} filter="url(#node-shadow)">
              <ellipse cx={boxW / 2} cy={boxH + 8} rx={boxW * 0.34} ry="6" fill="rgba(15,23,42,0.55)" />
              <rect x="2" y="4" width={boxW} height={boxH} rx={node.kind === "page" ? 10 : 14} fill="rgba(2,6,23,0.56)" stroke="rgba(148,163,184,0.15)" strokeWidth="0.8" />
              <rect width={boxW} height={boxH} rx={node.kind === "page" ? 10 : 14} fill={bg} stroke={col} strokeWidth={isMainNode ? 1.6 : 1.1} strokeOpacity={isMainNode ? 0.8 : 0.5} />
              <rect width={boxW} height={boxH} rx={node.kind === "page" ? 10 : 14} fill="url(#node-face)" opacity="0.8" />

              <rect x="5" y="6" width={boxW - 10} height="6" rx="3" fill="rgba(255,255,255,0.1)" opacity="0.3">
                <animate attributeName="opacity" values="0.12;0.35;0.12" dur={`${4 + (idx % 4) * 0.8}s`} repeatCount="indefinite" />
              </rect>

              <g transform={`translate(${boxW / 2 - (node.kind === "page" ? 8 : 12)}, ${node.kind === "page" ? 7 : 12})`} style={{ color: col }}>
                <NodeIcon kind={node.kind} size={node.kind === "page" ? 16 : 24} />
              </g>

              <text x={boxW / 2} y={node.kind === "page" ? 42 : 56} textAnchor="middle" fontSize={node.kind === "page" ? "7" : "9"} fill="rgba(226,232,240,0.95)" fontFamily="monospace" fontWeight="600">
                {node.label.length > 10 ? node.label.slice(0, 9) + "..." : node.label}
              </text>

              <circle cx={boxW - 9} cy={9} r="4.2" fill={col} filter="url(#packet-glow)">
                <animate attributeName="opacity" values={node.status === "error" ? "1;0.2;1" : "1;0.45;1"} dur={node.status === "error" ? "0.7s" : "2.4s"} repeatCount="indefinite" />
              </circle>
            </g>
          )
        })}

        <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.74)" fontFamily="monospace" letterSpacing="0.6">
          {lastStatusOk ? "SYSTEM STATUS: OPERATIONAL" : "SYSTEM STATUS: INCIDENT DETECTED"}
        </text>
      </svg>

      <div className="px-5 pb-5">
        <div className="rounded-xl p-3" style={{ background: "rgba(2,6,23,0.45)", border: "1px solid rgba(56,189,248,0.18)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>Heatmap latence par route (estimation)</h3>
            <span className="text-[10px]" style={{ color: "#94a3b8" }}>ms estimées à partir de la stabilité</span>
          </div>
          {latencyHeat.length === 0 ? (
            <p className="text-xs py-2" style={{ color: "#94a3b8" }}>Aucune route monitorée</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {latencyHeat.map((row) => {
                const color = latencyColor(row.latencyMs)
                const totalBars = 14
                const filled = Math.max(1, Math.round((row.latencyMs / 320) * totalBars))
                return (
                  <div key={row.url} className="rounded-lg p-2" style={{ background: "rgba(15,23,42,0.52)", border: "1px solid rgba(148,163,184,0.16)" }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-mono truncate max-w-[70%]" style={{ color: "#e2e8f0" }}>{row.url || "/"}</span>
                      <span className="text-[11px] font-semibold" style={{ color }}>{row.latencyMs} ms</span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: totalBars }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-2 flex-1 rounded-sm"
                          style={{
                            background: idx < filled ? color : "rgba(51,65,85,0.55)",
                            opacity: idx < filled ? 0.85 : 0.35,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${color} text-white shadow-lg flex flex-col gap-1`}>
      <div className="text-xs opacity-75 font-medium">{label}</div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-60">{sub}</div>}
    </div>
  )
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</span>
        {open ? <ChevronUp size={16} style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </section>
  )
}

function BarChart({ data, colorFn }: {
  data: { label: string; value: number; tooltip?: string }[]
  colorFn?: (v: number, max: number) => string
}) {
  if (!data.length) return <p className="text-xs py-4 text-center" style={{ color: "var(--muted-foreground)" }}>Aucune donnée</p>
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const BAR_H = 120
  const BAR_W = Math.max(28, Math.min(52, Math.floor(560 / data.length) - 8))
  const GAP = 8
  const totalW = data.length * (BAR_W + GAP) - GAP

  return (
    <div className="overflow-x-auto">
      <svg width={totalW + 24} height={BAR_H + 44} viewBox={`0 0 ${totalW + 24} ${BAR_H + 44}`} style={{ display: "block" }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / maxVal) * BAR_H, 2)
          const x = 12 + i * (BAR_W + GAP)
          const y = BAR_H - h
          const col = colorFn ? colorFn(d.value, maxVal) : "#38bdf8"
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={BAR_W} height={h} rx={5} fill={col} opacity={0.88} />
              {d.value > 0 && (
                <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.value}</text>
              )}
              <text x={x + BAR_W / 2} y={BAR_H + 16} textAnchor="middle" fontSize="9" fill="#64748b">
                {d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label}
              </text>
            </g>
          )
        })}
        <line x1={12} y1={BAR_H} x2={totalW + 12} y2={BAR_H} stroke="#334155" strokeWidth={1} />
      </svg>
    </div>
  )
}

function UptimeGauge({ pct }: { pct: number }) {
  const r = 52
  const cx = 70
  const cy = 70
  const circumference = Math.PI * r
  const dash = (pct / 100) * circumference
  const color = pct >= 99 ? "#22c55e" : pct >= 95 ? "#f59e0b" : "#ef4444"
  const label = pct >= 99 ? "Excellent" : pct >= 95 ? "Correct" : "Attention"

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={140} height={80} viewBox="0 0 140 80">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#1e293b" strokeWidth={14} strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{pct}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{label}</text>
      </svg>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminScriptsDataPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<ScriptsPayload | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Session admin introuvable.")
      setLoading(false)
      return
    }
    const response = await fetch("/api/admin/scripts-data", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      const text = await response.text()
      setError(`Erreur API (${response.status}): ${text}`)
      setLoading(false)
      return
    }
    const json = (await response.json()) as ScriptsPayload
    setPayload(json)
    setLoading(false)
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefreshing(true)
      void loadData().finally(() => setRefreshing(false))
    }, 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [loadData])

  // ── Analyse des données monitor ──────────────────────────────────────────
  const analysis = useMemo(() => {
    const history = payload?.data.monitorHistory ?? []
    const last = payload?.data.monitorLast

    const totalRuns = history.length
    const failedRuns = history.filter(r => r.failed > 0).length
    const okRuns = totalRuns - failedRuns
    const uptimePct = totalRuns > 0 ? Math.round((okRuns / totalRuns) * 100) : 100

    // Taux de succès par URL
    const urlStats: Record<string, { ok: number; fail: number }> = {}
    history.forEach(run => {
      (run.checks ?? []).forEach(c => {
        const u = c.url.replace("https://www.milele4ever.com", "").replace("https://milele4ever.com", "") || "/"
        if (!urlStats[u]) urlStats[u] = { ok: 0, fail: 0 }
        if (c.result === "OK") urlStats[u].ok++
        else urlStats[u].fail++
      })
    })

    // Histogramme temporel: last 30 runs
    const recentRuns = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(-30)

    // Déploiements
    const deployments = (payload?.data.feedbackDeployments ?? []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const doneCount = deployments.filter(d => d.status === "done").length

    // Synthèse textuelle
    let interpretation = ""
    if (totalRuns === 0) {
      interpretation = "Aucun historique de monitoring disponible. Les scripts ne semblent pas encore avoir tourné."
    } else if (uptimePct === 100) {
      interpretation = `✅ La plateforme milele4ever.com est en parfait état. Sur ${totalRuns} vérification${totalRuns > 1 ? "s" : ""} enregistrée${totalRuns > 1 ? "s" : ""}, aucune panne n'a été détectée. Disponibilité : 100%.`
    } else if (uptimePct >= 95) {
      interpretation = `🟡 La plateforme est globalement stable. ${failedRuns} vérification${failedRuns > 1 ? "s" : ""} sur ${totalRuns} ont signalé des problèmes (${uptimePct}% de disponibilité).`
    } else {
      interpretation = `🔴 Attention — la plateforme présente des instabilités. ${failedRuns} vérification${failedRuns > 1 ? "s" : ""} sur ${totalRuns} ont échoué (${uptimePct}% de disponibilité). Vérifier les logs.`
    }

    // Dernier statut
    const lastStatusOk = !last || last.failed === 0
    const lastStatusLabel = last ? (last.status === "OK" ? "Tout fonctionne" : `${last.failed} page${last.failed > 1 ? "s" : ""} en erreur`) : "Inconnu"

    return { totalRuns, failedRuns, okRuns, uptimePct, urlStats, recentRuns, deployments, doneCount, interpretation, lastStatusOk, lastStatusLabel, last }
  }, [payload])

  const deploymentsByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    ;(analysis.deployments ?? []).forEach(d => {
      const key = d.date.slice(0, 7)
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => ({
      label: new Date(key + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      value,
    }))
  }, [analysis.deployments])

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button onClick={() => router.push("/admin")} className="inline-flex items-center gap-2 text-sm mb-3" style={{ color: "var(--primary)" }}>
            <ArrowLeft size={16} /> Retour admin
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>Tableau de bord opérationnel</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Rafraîchissement automatique toutes les 5 minutes • Dernière lecture: {payload?.refreshedAt ? fmtDate(payload.refreshedAt) : "—"}</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); void loadData().finally(() => setRefreshing(false)) }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-9 h-9 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
        </div>
      ) : error ? (
        <div className="rounded-2xl p-5" style={{ background: "color-mix(in srgb, #ef4444 12%, var(--card))", border: "1px solid color-mix(in srgb, #ef4444 30%, var(--border))" }}>
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Topologie réseau animée ────────────────────────────────────── */}
          <NetworkTopology
            urlStats={analysis.urlStats}
            lastStatusOk={analysis.lastStatusOk}
            totalRuns={analysis.totalRuns}
          />

          {/* ── Interprétation globale ─────────────────────────────────────── */}
          <div className="rounded-2xl p-5" style={{
            background: analysis.uptimePct === 100 ? "color-mix(in srgb, #22c55e 12%, var(--card))"
              : analysis.uptimePct >= 95 ? "color-mix(in srgb, #f59e0b 12%, var(--card))"
              : "color-mix(in srgb, #ef4444 12%, var(--card))",
            border: `1px solid ${analysis.uptimePct === 100 ? "color-mix(in srgb, #22c55e 30%, var(--border))" : analysis.uptimePct >= 95 ? "color-mix(in srgb, #f59e0b 30%, var(--border))" : "color-mix(in srgb, #ef4444 30%, var(--border))"}`
          }}>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--foreground)" }}>{analysis.interpretation}</p>
          </div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Disponibilité"
              value={`${analysis.uptimePct}%`}
              sub={`${analysis.okRuns} / ${analysis.totalRuns} runs OK`}
              color={analysis.uptimePct === 100 ? "from-emerald-500 to-emerald-700" : analysis.uptimePct >= 95 ? "from-amber-500 to-amber-700" : "from-rose-500 to-rose-700"}
            />
            <KpiCard
              label="Dernier statut"
              value={analysis.lastStatusOk ? "✓ OK" : "✗ Erreur"}
              sub={analysis.last ? fmtDate(analysis.last.timestamp) : "Aucun run"}
              color={analysis.lastStatusOk ? "from-sky-500 to-sky-700" : "from-rose-500 to-rose-700"}
            />
            <KpiCard
              label="Pannes détectées"
              value={analysis.failedRuns}
              sub={`Sur ${analysis.totalRuns} vérifications`}
              color={analysis.failedRuns === 0 ? "from-violet-500 to-violet-700" : "from-orange-500 to-orange-700"}
            />
            <KpiCard
              label="Déploiements"
              value={analysis.deployments.length}
              sub={`${analysis.doneCount} livrés`}
              color="from-indigo-500 to-indigo-700"
            />
          </div>

          {/* ── Jauge + Uptime par page ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jauge globale */}
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Disponibilité globale</h2>
              <div className="flex flex-col items-center">
                <UptimeGauge pct={analysis.uptimePct} />
                <p className="text-xs mt-3 text-center" style={{ color: "var(--muted-foreground)" }}>
                  Basé sur {analysis.totalRuns} run{analysis.totalRuns > 1 ? "s" : ""} de monitoring enregistré{analysis.totalRuns > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Taux de succès par URL */}
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Disponibilité par page surveillée</h2>
              {Object.keys(analysis.urlStats).length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--muted-foreground)" }}>Aucune donnée par URL</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analysis.urlStats).map(([url, stat]) => {
                    const total = stat.ok + stat.fail
                    const pct = total > 0 ? Math.round((stat.ok / total) * 100) : 100
                    const color = pct === 100 ? "#22c55e" : pct >= 95 ? "#f59e0b" : "#ef4444"
                    return (
                      <div key={url}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-mono truncate max-w-[60%]" style={{ color: "var(--foreground)" }}>{url || "/"}</span>
                          <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "var(--secondary)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{stat.ok} OK · {stat.fail} échec{stat.fail > 1 ? "s" : ""}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Histogramme temporel des runs ──────────────────────────────── */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Historique des vérifications (30 dernières)</h2>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
              Chaque barre = 1 run de monitoring. <span style={{ color: "#22c55e" }}>Vert</span> = OK, <span style={{ color: "#ef4444" }}>Rouge</span> = panne détectée.
            </p>
            {analysis.recentRuns.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "var(--muted-foreground)" }}>Aucun historique disponible</p>
            ) : (
              <BarChart
                data={analysis.recentRuns.map(r => ({
                  label: fmtDateShort(r.timestamp),
                  value: r.total - r.failed,
                  tooltip: `${r.total - r.failed}/${r.total} OK`,
                }))}
                colorFn={(v, max) => v === max ? "#22c55e" : v > 0 ? "#f59e0b" : "#ef4444"}
              />
            )}
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>Hauteur = nombre de pages OK sur ce run</p>
          </div>

          {/* ── Histogramme déploiements par mois ──────────────────────────── */}
          {deploymentsByMonth.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Déploiements par mois</h2>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Nombre de livraisons en production chaque mois.</p>
              <BarChart
                data={deploymentsByMonth}
                colorFn={() => "#818cf8"}
              />
            </div>
          )}

          {/* ── Timeline des déploiements ──────────────────────────────────── */}
          {analysis.deployments.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
                Timeline des déploiements ({analysis.deployments.length} au total)
              </h2>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {analysis.deployments.map((d, i) => (
                  <div key={d.id ?? i} className="flex gap-3 items-start">
                    <div className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: d.status === "done" ? "#22c55e" : "#f59e0b" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{d.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                          background: d.status === "done" ? "color-mix(in srgb, #22c55e 15%, transparent)" : "color-mix(in srgb, #f59e0b 15%, transparent)",
                          color: d.status === "done" ? "#22c55e" : "#f59e0b",
                          border: `1px solid ${d.status === "done" ? "color-mix(in srgb, #22c55e 30%, transparent)" : "color-mix(in srgb, #f59e0b 30%, transparent)"}`,
                        }}>
                          {d.status === "done" ? "Livré" : d.status}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{fmtDate(d.date)}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{d.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Données brutes (repliables) ────────────────────────────────── */}
          <div className="space-y-3">
            <Collapsible title="📄 Données brutes — monitor-last.json">
              <pre className="text-xs p-3 rounded-xl overflow-auto max-h-64" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{JSON.stringify(payload?.data.monitorLast ?? null, null, 2)}
              </pre>
            </Collapsible>

            <Collapsible title={`📋 Historique complet monitoring (${payload?.data.monitorHistory.length ?? 0} runs)`}>
              <pre className="text-xs p-3 rounded-xl overflow-auto max-h-[420px]" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{JSON.stringify(payload?.data.monitorHistory ?? [], null, 2)}
              </pre>
            </Collapsible>

            <Collapsible title="📊 monitor-excel.csv (aperçu)">
              <pre className="text-xs p-3 rounded-xl overflow-auto max-h-64" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{(payload?.data.monitorExcelCsv ?? "").split(/\r?\n/).slice(0, 40).join("\n") || "Aucune donnée"}
              </pre>
            </Collapsible>

            <Collapsible title="📤 État des exports (Excel + Smartsheet)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>Excel push state</p>
                  <pre className="text-xs p-3 rounded-xl overflow-auto" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{JSON.stringify(payload?.data.excelPushState ?? null, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>Smartsheet push state</p>
                  <pre className="text-xs p-3 rounded-xl overflow-auto" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{JSON.stringify(payload?.data.smartsheetPushState ?? null, null, 2)}
                  </pre>
                </div>
              </div>
            </Collapsible>

            <Collapsible title={`🚀 feedback_deployments.json (${((payload?.data.feedbackDeployments) ?? []).length} entrées)`}>
              <pre className="text-xs p-3 rounded-xl overflow-auto max-h-64" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{JSON.stringify(payload?.data.feedbackDeployments ?? null, null, 2)}
              </pre>
            </Collapsible>

            {(payload?.data.tasksText || payload?.data.processesText) && (
              <Collapsible title="📝 tasks.txt / processes.txt">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>tasks.txt</p>
                    <pre className="text-xs p-3 rounded-xl overflow-auto max-h-48" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{payload?.data.tasksText || "(vide)"}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>processes.txt</p>
                    <pre className="text-xs p-3 rounded-xl overflow-auto max-h-48" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
{payload?.data.processesText || "(vide)"}
                    </pre>
                  </div>
                </div>
              </Collapsible>
            )}

            <Collapsible title={`🗂 Scripts détectés (${payload?.data.scriptsList.length ?? 0} fichiers)`}>
              <div className="flex flex-wrap gap-2">
                {(payload?.data.scriptsList ?? []).map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-mono" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>{s}</span>
                ))}
              </div>
            </Collapsible>
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Database size={14} />
            La page se rafraîchit automatiquement toutes les 5 minutes.
          </div>
        </div>
      )}
    </div>
  )
}
