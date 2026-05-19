"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Bell,
  Bug,
  CheckCircle,
  Cloud,
  Command,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  GitBranch,
  Globe,
  HardDrive,
  LineChart,
  Lock,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Moon,
  RefreshCw,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Terminal,
  UserPlus,
  Users,
  Wifi,
  Zap,
} from "lucide-react"

import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import MonarkIcon from "@/components/staff/MonarkIcon"
import MonarkQuickAssistant from "@/components/staff/MonarkQuickAssistant"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ROLE_CATEGORIES } from "@/lib/roles"
import { supabase } from "@/lib/supabaseClient"

const KENT_EMAIL = "kentleyk@gmail.com"
const AVATAR_COLORS = ["bg-sky-500", "bg-blue-500", "bg-cyan-500", "bg-indigo-500", "bg-slate-500", "bg-sky-600"]

type StaffMember = {
  user_id: string
  full_name: string | null
  email: string | null
  role_name: string | null
  status: string | null
  accent_color: Record<string, unknown> | null
}

type StaffProfileRecord = {
  user_id: string
  email: string | null
  full_name: string | null
  role_id: string | null
  role_name: string | null
  role_category: string | null
  status: string
  created_at: string
}

type FeedbackRow = {
  id: string
  type: string
  status: string
  created_at: string
}

type StaffMetricPayload = {
  me?: StaffMember | null
  teamPreview?: StaffMember[]
  feedbackRows?: FeedbackRow[]
  counts?: {
    approvedMembers?: number
    pendingApprovals?: number
    feedbackTotal?: number
    feedbackNew?: number
  }
}

type SentryIssue = {
  id: string
  title: string
  count: number
  level: string
  firstSeen: string
  lastSeen: string
}

type MonitoringData = {
  sentry: { connected: boolean; dsnConfigured: boolean; issues: SentryIssue[] }
  slack: { connected: boolean; fallbackMode?: boolean }
  cloudflare: {
    requests: { all: number; cached: number; uncached: number; cacheHitRate: string }
    bandwidth: { all: string; cached: string }
    threats: number
    pageViews: number
    uniques: number
  } | null
  cfConfigured: boolean
  cfFallbackMode?: boolean
} | null

type MonarkLogEntry = {
  id: string
  timestamp: string
  type: "error" | "info" | "debug" | "request" | "response" | "auth"
  data: Record<string, unknown>
  env: string
}

type MonarkLogsPayload = {
  ok: boolean
  count: number
  stats?: {
    total?: number
    hasWebhook?: boolean
  }
  logs: MonarkLogEntry[]
}

type TicketPayload = {
  tickets?: Array<{
    id: string
    title: string
    status: string
    created_at: string
    reporter_name?: string | null
  }>
}

type Communication = {
  id: string
  sender: string
  time: string
  message: string
  unread?: boolean
}

type TimePoint = { label: string; value: number }
type CategoryPoint = { label: string; pct: number; color: string }
type PeriodKey = "W" | "1M" | "3M" | "6M" | "1A"
type SectionKey = "cockpit" | "overview" | "diagnostics" | "data-center" | "network" | "security" | "console" | "monark" | "communications" | "monitoring" | "settings"
type PresenceStatus = "En ligne" | "Occupé" | "En réunion" | "Absent"

const CATEGORY_COLORS: Record<string, string> = {
  bug: "#38bdf8",
  feature: "#0ea5e9",
  idea: "#60a5fa",
  compliment: "#93c5fd",
  other: "#64748b",
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Fonctionnalité",
  idea: "Idée",
  compliment: "Compliment",
  other: "Autre",
}

const DASH_ACTIONS = [
  { label: "Feedbacks", href: "/staff?view=suggestions", icon: Terminal },
  { label: "Voir l'équipe", href: "/staff?view=team", icon: Users },
  { label: "Analytiques", href: "/staff?view=analytics", icon: BarChart3 },
  { label: "Chat équipe", href: "/staff?view=chat", icon: MessageSquare },
] as const

const SECTION_ITEMS: Array<{ key: SectionKey; label: string; icon: LucideIcon }> = [
  { key: "cockpit", label: "Cockpit", icon: Command },
  { key: "overview", label: "Vue d'ensemble", icon: Activity },
  { key: "diagnostics", label: "Diagnostics", icon: Cpu },
  { key: "data-center", label: "Centre de données", icon: Database },
  { key: "network", label: "Réseau", icon: Globe },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "console", label: "Console", icon: Terminal },
  { key: "monark", label: "Monark", icon: Sparkles },
  { key: "communications", label: "Communications", icon: MessageSquare },
  { key: "monitoring", label: "Monitoring", icon: Zap },
  { key: "settings", label: "Réglages", icon: Settings },
]

function getAvatar(member: StaffMember | null): string | null {
  const accent = member?.accent_color as Record<string, unknown> | null
  if (!accent) return null
  const profile = accent.profile as Record<string, unknown> | undefined
  return (profile?.avatar_url as string) ?? null
}

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(" ").map((item) => item[0]).join("").slice(0, 2).toUpperCase()
  return (email ?? "ST").slice(0, 2).toUpperCase()
}

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return `il y a ${Math.floor(hours / 24)} j`
}

function getLast6Months(): { key: string; label: string }[] {
  const months = []
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - index)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleDateString("fr-FR", { month: "short" })
    months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return months
}

function getLastNMonths(n: number): { key: string; label: string }[] {
  const now = new Date()
  const startYear = new Date(now.getFullYear(), now.getMonth() - n + 1, 1).getFullYear()
  const crossesYear = startYear < now.getFullYear()
  const months = []
  for (let index = n - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - index)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const shortMonth = date.toLocaleDateString("fr-FR", { month: "short" })
    const label = crossesYear
      ? `${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)} ${String(date.getFullYear()).slice(2)}`
      : shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)
    months.push({ key, label })
  }
  return months
}

function getLastNWeeks(n: number): { start: Date; end: Date; label: string }[] {
  const weeks = []
  const now = new Date()
  for (let index = n - 1; index >= 0; index -= 1) {
    const end = new Date(now)
    end.setDate(now.getDate() - index * 7)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const day = start.getDate()
    const month = start.toLocaleDateString("fr-FR", { month: "short" })
    weeks.push({ start, end, label: `${day} ${month.slice(0, 3)}.` })
  }
  return weeks
}

function getCurrentWeekBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

function getPeriodStart(period: PeriodKey, now = new Date()): Date {
  if (period === "W") return getCurrentWeekBounds(now).start
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (period === "1M") start.setDate(start.getDate() - 35) // 5 semaines
  if (period === "3M") start.setMonth(start.getMonth() - 3)
  if (period === "6M") start.setMonth(start.getMonth() - 6)
  if (period === "1A") start.setFullYear(start.getFullYear() - 1)
  return start
}

function getWeekPoints(rows: FeedbackRow[], now = new Date()): TimePoint[] {
  const dayAbbr = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const { start, end } = getCurrentWeekBounds(now)
  const points = dayAbbr.map((abbr, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { label: `${abbr} ${d.getDate()}`, value: 0 }
  })

  rows.forEach((row) => {
    const date = new Date(row.created_at)
    if (Number.isNaN(date.getTime()) || date < start || date >= end) return
    const day = date.getDay()
    const index = day === 0 ? 6 : day - 1
    points[index].value += 1
  })

  return points
}

function BarChart({ data }: { data: TimePoint[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const chartHeight = 120
  const barWidth = 28
  const gap = 14
  const totalWidth = data.length * (barWidth + gap) - gap

  return (
    <svg width="100%" viewBox={`0 0 ${totalWidth + 20} ${chartHeight + 28}`} preserveAspectRatio="xMidYMid meet">
      {data.map((item, index) => {
        const height = Math.max((item.value / maxValue) * chartHeight, 2)
        const x = index * (barWidth + gap)
        const y = chartHeight - height
        return (
          <g key={item.label}>
            <defs>
              <linearGradient id={`liquid-bar-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.52" />
              </linearGradient>
            </defs>
            <rect x={x} y={y} width={barWidth} height={height} rx={8} fill={`url(#liquid-bar-${index})`} />
            {item.value > 0 && <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#cbd5e1">{item.value}</text>}
            <text x={x + barWidth / 2} y={chartHeight + 18} textAnchor="middle" fontSize="11" fill="#64748b">{item.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ data }: { data: CategoryPoint[] }) {
  if (!data.length) {
    return <div className="py-10 text-center text-sm text-slate-400">Aucune catégorie sur la période</div>
  }

  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offsets = data.map((_, index) => data.slice(0, index).reduce((sum, item) => sum + item.pct, 0))

  return (
    <svg width="100%" viewBox="0 0 220 170" preserveAspectRatio="xMidYMid meet">
      <circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
      {data.map((item, index) => {
        const dash = (item.pct / 100) * circumference
        const gap = circumference - dash
        const rotation = (offsets[index] / 100) * 360 - 90
        return (
          <circle
            key={item.label}
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rotation}, 72, 72)`}
          />
        )
      })}
      {data.map((item, index) => (
        <g key={item.label} transform={`translate(138, ${28 + index * 24})`}>
          <rect x="0" y="-8" width="10" height="10" rx="3" fill={item.color} />
          <text x="16" y="0" fontSize="10" fill="#94a3b8">{item.label}</text>
          <text x="68" y="0" fontSize="10" fill="#e2e8f0" textAnchor="end">{item.pct}%</text>
        </g>
      ))}
    </svg>
  )
}

export default function LiquidDash() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>("En ligne")
  const [showAllSections, setShowAllSections] = useState(false)
  const [hourFx, setHourFx] = useState(false)
  const lastHourRef = useRef<number>(new Date().getHours())
  const [isLoading, setIsLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<PeriodKey>("W")
  const [activeSection, setActiveSection] = useState<SectionKey>("cockpit")
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastBody, setBroadcastBody] = useState("")
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastDone, setBroadcastDone] = useState<"success" | "error" | null>(null)
  const [securityFilter, setSecurityFilter] = useState<"all" | "approved" | "pending" | "rejected">("all")

  const [systemStatus, setSystemStatus] = useState(84)
  const [cpuUsage, setCpuUsage] = useState(41)
  const [memoryUsage, setMemoryUsage] = useState(64)
  const [networkStatus, setNetworkStatus] = useState(90)
  const [securityLevel, setSecurityLevel] = useState(78)

  const [myProfile, setMyProfile] = useState<StaffMember | null>(null)
  const [team, setTeam] = useState<StaffMember[]>([])
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([])
  const [profiles, setProfiles] = useState<StaffProfileRecord[]>([])
  const [approvedMembers, setApprovedMembers] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const [feedbackNew, setFeedbackNew] = useState(0)
  const [openTickets, setOpenTickets] = useState(0)
  const [communications, setCommunications] = useState<Communication[]>([])

  const [monitoringData, setMonitoringData] = useState<MonitoringData>(null)
  const [slackTestMsg, setSlackTestMsg] = useState("")
  const [slackSending, setSlackSending] = useState(false)
  const [slackResult, setSlackResult] = useState<"success" | "error" | null>(null)
  const [cfPurging, setCfPurging] = useState(false)
  const [cfPurgeResult, setCfPurgeResult] = useState<"success" | "error" | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [monarkLogs, setMonarkLogs] = useState<MonarkLogEntry[]>([])
  const [monarkLogCount, setMonarkLogCount] = useState(0)
  const [monarkHasWebhook, setMonarkHasWebhook] = useState(false)
  const [monarkLoading, setMonarkLoading] = useState(false)
  const [monarkLogsError, setMonarkLogsError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      const user = session?.user ?? null

      if (!alive) return
      if (!user || !session?.access_token) {
        setIsLoading(false)
        setAuthorized(false)
        return
      }

      const isKent = user.email === KENT_EMAIL
      if (isKent) {
        setAuthorized(true)
      } else {
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("role_id, status")
          .eq("user_id", user.id)
          .single()
        setAuthorized(profile?.role_id === "admin-supreme" && profile?.status === "approved")
      }

      setToken(session.access_token)
      setIsLoading(false)
    }

    bootstrap()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 280)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    const hour = currentTime.getHours()
    const isHourTick = currentTime.getMinutes() === 0 && currentTime.getSeconds() < 3 && lastHourRef.current !== hour
    if (isHourTick) {
      lastHourRef.current = hour
      setHourFx(true)
      window.setTimeout(() => setHourFx(false), 2300)
    }
  }, [currentTime])

  useEffect(() => {
    if (!authorized || !token) return

    let alive = true

    async function syncData() {
      try {
        const [metricsRes, ticketsRes, profilesRes] = await Promise.all([
          fetch("/api/staff/metrics", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch("/api/staff/tickets", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          supabase
            .from("staff_profiles")
            .select("user_id, email, full_name, role_id, role_name, role_category, status, created_at")
            .order("created_at", { ascending: false }),
        ])

        if (!alive) return

        if (metricsRes.ok) {
          const metrics = (await metricsRes.json()) as StaffMetricPayload
          const approved = Number(metrics.counts?.approvedMembers ?? 0)
          const pending = Number(metrics.counts?.pendingApprovals ?? 0)
          const total = Number(metrics.counts?.feedbackTotal ?? 0)
          const fresh = Number(metrics.counts?.feedbackNew ?? 0)

          setMyProfile(metrics.me ?? null)
          setTeam(metrics.teamPreview ?? [])
          setFeedbackRows(metrics.feedbackRows ?? [])
          setApprovedMembers(approved)
          setPendingApprovals(pending)
          setFeedbackTotal(total)
          setFeedbackNew(fresh)

          setMemoryUsage(Math.max(40, Math.min(92, 48 + approved * 2)))
          setNetworkStatus(Math.max(55, Math.min(98, 68 + fresh * 2)))
          setSecurityLevel(Math.max(72, Math.min(99, 84 + Math.min(pending, 8))))
        }

        if (ticketsRes.ok) {
          const ticketPayload = (await ticketsRes.json()) as TicketPayload
          const tickets = Array.isArray(ticketPayload.tickets) ? ticketPayload.tickets : []
          const active = tickets.filter((ticket) => ticket.status !== "Fermé" && ticket.status !== "Résolu").length
          setOpenTickets(active)
          setCpuUsage(Math.max(25, Math.min(93, 28 + active * 5)))
          setSystemStatus(Math.max(72, Math.min(99, 94 - Math.min(active, 14))))
          setCommunications(
            tickets.slice(0, 5).map((ticket) => ({
              id: ticket.id,
              sender: ticket.reporter_name || "Staff",
              time: new Date(ticket.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              message: `${ticket.title} · ${ticket.status}`,
              unread: ticket.status === "Ouvert" || ticket.status === "En cours",
            }))
          )
        }

        setProfiles((profilesRes.data ?? []) as StaffProfileRecord[])
      } catch {
        // conserver le dernier état stable
      }
    }

    async function syncMonitoring() {
      if (!alive || !token) return
      try {
        const [res, monarkRes] = await Promise.all([
          fetch("/api/staff/monitoring", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch("/api/staff/monark?limit=12", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ])
        if (!alive) return
        if (res.ok) {
          setMonitoringData(await res.json())
        }

        if (monarkRes.ok) {
          const payload = (await monarkRes.json()) as MonarkLogsPayload
          if (!alive) return
          setMonarkLogs(payload.logs ?? [])
          setMonarkLogCount(payload.count ?? 0)
          setMonarkHasWebhook(Boolean(payload.stats?.hasWebhook))
          setMonarkLogsError(null)
        } else if (monarkRes.status !== 401) {
          setMonarkLogsError("Monark indisponible")
        }
      } catch {
        // keep last state
      }
    }

    syncData()
    syncMonitoring()
    const refresh = window.setInterval(syncData, 30000)
    const monitoringRefresh = window.setInterval(syncMonitoring, 120000)
    return () => {
      alive = false
      window.clearInterval(refresh)
      window.clearInterval(monitoringRefresh)
    }
  }, [authorized, token])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const surface = canvas
    const context = canvas.getContext("2d")
    if (!context) return
    const ctx = context

    surface.width = surface.offsetWidth
    surface.height = surface.offsetHeight

    const particles = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * surface.width,
      y: Math.random() * surface.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: `rgba(${Math.floor(Math.random() * 60) + 120}, ${Math.floor(Math.random() * 70) + 170}, ${Math.floor(Math.random() * 80) + 190}, ${Math.random() * 0.35 + 0.12})`,
    }))

    function animate() {
      ctx.clearRect(0, 0, surface.width, surface.height)
      particles.forEach((particle) => {
        particle.x += particle.speedX
        particle.y += particle.speedY
        if (particle.x > surface.width) particle.x = 0
        if (particle.x < 0) particle.x = surface.width
        if (particle.y > surface.height) particle.y = 0
        if (particle.y < 0) particle.y = surface.height
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })
      requestAnimationFrame(animate)
    }

    animate()

    const onResize = () => {
      surface.width = surface.offsetWidth
      surface.height = surface.offsetHeight
    }

    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const cyclePresence = () => {
    const next: Record<PresenceStatus, PresenceStatus> = {
      "En ligne": "Occupé",
      "Occupé": "En réunion",
      "En réunion": "Absent",
      "Absent": "En ligne",
    }
    setPresenceStatus(next[presenceStatus])
  }
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const formatTime = (date: Date) => date.toLocaleTimeString("fr-FR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const formatDate = (date: Date) => date.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })

  const approvedProfiles = useMemo(() => profiles.filter((profile) => profile.status === "approved" && profile.role_id !== "admin-supreme"), [profiles])
  const pendingProfiles = useMemo(() => profiles.filter((profile) => profile.status === "pending_approval"), [profiles])
  const rejectedProfiles = useMemo(() => profiles.filter((profile) => profile.status === "rejected"), [profiles])
  const pendingRoleProfiles = useMemo(() => profiles.filter((profile) => profile.status === "pending_role"), [profiles])

  const categoryStats = useMemo(
    () => ROLE_CATEGORIES.map((category) => ({
      ...category,
      count: approvedProfiles.filter((profile) => profile.role_category === category.id).length,
      total: category.roles.filter((role) => !("locked" in role && role.locked)).length,
    })),
    [approvedProfiles]
  )

  const momentumScore = useMemo(() => {
    const totalSignals = Math.max(approvedMembers + pendingApprovals + feedbackTotal, 1)
    return Math.min(100, Math.round(((approvedMembers * 2 + (feedbackTotal - feedbackNew)) / totalSignals) * 100))
  }, [approvedMembers, pendingApprovals, feedbackNew, feedbackTotal])

  const dailyFocus = useMemo(() => {
    if (feedbackNew > 0) return `Priorité du jour : ${feedbackNew} feedback${feedbackNew > 1 ? "s" : ""} nouveau${feedbackNew > 1 ? "x" : ""} à traiter.`
    if (pendingApprovals > 0) return `Priorité du jour : ${pendingApprovals} demande${pendingApprovals > 1 ? "s" : ""} staff en attente.`
    return "Priorité du jour : maintenir la qualité et accélérer les réponses équipe."
  }, [feedbackNew, pendingApprovals])

  const analytics = useMemo(() => {
    const now = new Date()
    const periodStart = getPeriodStart(analyticsPeriod, now)
    const filteredRows = feedbackRows.filter((row) => {
      const created = new Date(row.created_at)
      if (Number.isNaN(created.getTime())) return false
      return created >= periodStart
    })

    const total = filteredRows.length
    const resolved = filteredRows.filter((row) => row.status === "done").length
    const inProgress = filteredRows.filter((row) => row.status === "in-progress").length
    const newCount = filteredRows.filter((row) => row.status === "new").length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    const series = analyticsPeriod === "W"
      ? getWeekPoints(filteredRows, now)
      : analyticsPeriod === "1M"
      ? (() => {
          const weeks = getLastNWeeks(5)
          return weeks.map(({ start, end, label }) => ({
            label,
            value: filteredRows.filter((row) => {
              const d = new Date(row.created_at)
              return !Number.isNaN(d.getTime()) && d >= start && d <= end
            }).length,
          }))
        })()
      : (() => {
          const n = analyticsPeriod === "3M" ? 3 : analyticsPeriod === "6M" ? 6 : 12
          const months = getLastNMonths(n)
          const monthMap: Record<string, number> = {}
          months.forEach((month) => { monthMap[month.key] = 0 })
          filteredRows.forEach((row) => {
            const key = row.created_at.slice(0, 7)
            if (key in monthMap) monthMap[key] += 1
          })
          return months.map((month) => ({ label: month.label, value: monthMap[month.key] }))
        })()

    const typeCounts: Record<string, number> = {}
    filteredRows.forEach((row) => {
      typeCounts[row.type] = (typeCounts[row.type] ?? 0) + 1
    })

    const categories = Object.entries(typeCounts)
      .sort((left, right) => right[1] - left[1])
      .map(([type, count]) => ({
        label: CATEGORY_LABELS[type] ?? type,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_COLORS[type] ?? "#64748b",
      }))

    return {
      series,
      categories,
      kpis: {
        total,
        resolved,
        resolutionRate,
        newCount,
        inProgress,
        members: approvedMembers,
      },
    }
  }, [analyticsPeriod, approvedMembers, feedbackRows])

  const profileName = myProfile?.full_name ?? myProfile?.email?.split("@")[0] ?? "Administrateur"
  const profileRole = myProfile?.role_name ?? "Administrateur suprême"
  const profileStatus = myProfile?.status ?? "approved"
  const profileAvatar = getAvatar(myProfile)
  const profileInitials = getInitials(myProfile?.full_name ?? null, myProfile?.email ?? null)
  const profileColor = hashColor(myProfile?.user_id ?? KENT_EMAIL)
  const statusTone = profileStatus === "approved"
    ? "text-cyan-100 border-cyan-500/25 bg-cyan-500/10"
    : profileStatus === "pending_approval"
      ? "text-sky-100 border-sky-500/25 bg-sky-500/10"
      : "text-slate-200 border-slate-500/25 bg-slate-500/10"

  const ANNOUNCEMENT_DEADLINE = new Date("2026-06-03T23:59:59")
  const showAnnouncement = currentTime < ANNOUNCEMENT_DEADLINE

  const teamAnnouncement = useMemo(() => [
    "Équipe Aeternum,",
    "",
    "Nous passerons prochainement sur la nouvelle version du cockpit staff Liquid Dash.",
    "Cette évolution fusionne les données du dashboard administrateur et du dashboard opérationnel dans une interface plus fluide, plus claire et plus adaptée au travail quotidien.",
    "",
    `Points clés actuels : ${approvedMembers} membres actifs, ${pendingApprovals} demandes en attente, ${feedbackNew} feedbacks nouveaux, ${openTickets} tickets actifs.`,
    "",
    "Merci de préparer vos repères de travail sur cette nouvelle version. Vos retours seront centralisés dans Suggestions et dans le chat équipe.",
    "",
    "Kent Ley",
  ].join("\n"), [approvedMembers, pendingApprovals, feedbackNew, openTickets])

  const monarkHighlights = useMemo(() => [
    `Depuis l'ouverture du staff, ${approvedProfiles.length + 1} profils sont déjà validés pour opérer dans le cockpit.`,
    pendingProfiles.length > 0
      ? `${pendingProfiles.length} demande${pendingProfiles.length > 1 ? "s" : ""} nécessite${pendingProfiles.length > 1 ? "nt" : ""} encore une décision rapide avant la bascule.`
      : "Aucune demande bloquante n'est en attente, la bascule peut rester centrée sur l'exécution.",
    `Le taux de résolution est actuellement de ${analytics.kpis.resolutionRate}%, avec ${analytics.kpis.inProgress} feedback${analytics.kpis.inProgress > 1 ? "s" : ""} encore en cours.`,
    "La prochaine version du cockpit Liquid Dash privilégie une lecture plus dense, plus professionnelle et plus agréable pour les longues sessions de travail.",
  ], [analytics.kpis.inProgress, analytics.kpis.resolutionRate, approvedProfiles.length, pendingProfiles.length])

  const filteredProfilesBySecurity = useMemo(() => {
    if (securityFilter === "approved") return approvedProfiles
    if (securityFilter === "pending") return pendingProfiles
    if (securityFilter === "rejected") return rejectedProfiles
    return profiles.filter((p) => p.role_id !== "admin-supreme")
  }, [securityFilter, approvedProfiles, pendingProfiles, rejectedProfiles, profiles])

  const recentActions = useMemo(() => {
    type ActionEntry = { id: string; text: string; time: string; type: "feedback" | "member" }
    const actions: ActionEntry[] = []
    feedbackRows.slice(0, 6).forEach((row) => {
      actions.push({
        id: `fb-${row.id}`,
        text: `Feedback ${CATEGORY_LABELS[row.type] ?? row.type} — ${row.status}`,
        time: timeAgo(row.created_at),
        type: "feedback",
      })
    })
    profiles.slice(0, 6).forEach((p) => {
      actions.push({
        id: `pr-${p.user_id}`,
        text: `${p.full_name ?? p.email ?? "Membre"} — ${p.role_name ?? "Sans rôle"} (${p.status})`,
        time: timeAgo(p.created_at),
        type: "member",
      })
    })
    return actions.slice(0, 10)
  }, [feedbackRows, profiles])

  const jumpToSection = (key: SectionKey) => {
    const needsExpanded = key !== "cockpit" && key !== "overview" && key !== "console"
    if (needsExpanded && !showAllSections) {
      setShowAllSections(true)
      window.setTimeout(() => {
        setActiveSection(key)
        document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 80)
      return
    }
    setActiveSection(key)
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleCopyAnnouncement = async () => {
    try {
      await navigator.clipboard.writeText(teamAnnouncement)
      setCopiedAnnouncement(true)
      window.setTimeout(() => setCopiedAnnouncement(false), 2500)
    } catch {
      setCopiedAnnouncement(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim() || !token) return
    setBroadcastSending(true)
    setBroadcastDone(null)
    try {
      const res = await fetch("/api/staff/broadcast", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastTitle.trim(), message: broadcastBody.trim() }),
      })
      const data = (await res.json()) as { ok?: boolean }
      setBroadcastDone(res.ok && data.ok ? "success" : "error")
      if (res.ok && data.ok) {
        setBroadcastTitle("")
        setBroadcastBody("")
      }
    } catch {
      setBroadcastDone("error")
    } finally {
      setBroadcastSending(false)
      window.setTimeout(() => setBroadcastDone(null), 4000)
    }
  }

  const handleSlackTest = async () => {
    if (!token) return
    setSlackSending(true)
    setSlackResult(null)
    try {
      const res = await fetch("/api/staff/monitoring", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "slack-test", message: slackTestMsg || "Test depuis Liquid Dash." }),
      })
      const data = (await res.json()) as { ok?: boolean }
      setSlackResult(data.ok ? "success" : "error")
    } catch {
      setSlackResult("error")
    } finally {
      setSlackSending(false)
      window.setTimeout(() => setSlackResult(null), 4000)
    }
  }

  const handleCfPurge = async () => {
    if (!token) return
    setCfPurging(true)
    setCfPurgeResult(null)
    try {
      const res = await fetch("/api/staff/monitoring", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cf-purge" }),
      })
      const data = (await res.json()) as { ok?: boolean }
      setCfPurgeResult(data.ok ? "success" : "error")
    } catch {
      setCfPurgeResult("error")
    } finally {
      setCfPurging(false)
      window.setTimeout(() => setCfPurgeResult(null), 4000)
    }
  }

  const fetchMonarkLogs = async (quiet = false) => {
    if (!token) return
    if (!quiet) setMonarkLoading(true)
    setMonarkLogsError(null)
    try {
      const res = await fetch("/api/staff/monark?limit=12", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setMonarkLogsError(body.error ?? "Impossible de charger les logs Monark")
        return
      }
      const data = (await res.json()) as MonarkLogsPayload
      setMonarkLogs(data.logs ?? [])
      setMonarkLogCount(data.count ?? 0)
      setMonarkHasWebhook(Boolean(data.stats?.hasWebhook))
    } catch {
      setMonarkLogsError("Erreur réseau lors du chargement des logs Monark")
    } finally {
      if (!quiet) setMonarkLoading(false)
    }
  }

  const openMonarkApi = async () => {
    if (!token) return
    try {
      const res = await fetch("/api/staff/monark?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setMonarkLogsError(body.error ?? "Impossible d'ouvrir l'API Monark")
        return
      }

      const text = await res.text()
      const blob = new Blob([text], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch {
      setMonarkLogsError("Erreur réseau lors de l'ouverture de l'API Monark")
    }
  }

  if (!isLoading && !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-sky-500/20 bg-sky-500/10 p-6 text-center">
          <h1 className="text-2xl font-bold text-sky-100">Accès réservé</h1>
          <p className="mt-2 text-sm text-sky-50/80">Liquid Dash est réservé à l&apos;administrateur suprême.</p>
          <div className="mt-5 flex justify-center">
            <LiquidMetalButton label="Retour au staff" tinted width={170} height={42} fontSize={13} onClick={() => (window.location.href = "/staff")} />
          </div>
        </div>
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className={`${theme} min-h-screen relative overflow-hidden ${isDark ? "bg-gradient-to-br from-[#020712] via-[#061226] to-[#071a32] text-slate-100" : "bg-gradient-to-br from-[#eef6ff] via-[#dceeff] to-[#f7fbff] text-slate-900"}`}>
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full pointer-events-none ${isDark ? "opacity-30" : "opacity-45"}`} />
      <div className="container mx-auto p-4 relative z-10">
        <header className={`mb-6 rounded-3xl border p-4 backdrop-blur-2xl shadow-[0_30px_90px_rgba(2,8,22,0.20)] ${isDark ? "border-white/10 bg-slate-950/35" : "border-sky-200/65 bg-white/68"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/18 via-blue-500/12 to-slate-900/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_38px_rgba(14,165,233,0.26)]">
                {profileAvatar ? (
                  <Image src={profileAvatar} alt={profileName} width={88} height={88} sizes="88px" className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center text-3xl font-black text-white ${profileColor}`}>{profileInitials}</div>
                )}
              </div>
              <div className="min-w-[260px]">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>{presenceStatus}</div>
                  <select
                    value={presenceStatus}
                    onChange={(event) => setPresenceStatus(event.target.value as PresenceStatus)}
                    className={`rounded-xl border px-2 py-1 text-xs outline-none ${isDark ? "border-white/20 bg-slate-900/55 text-slate-100" : "border-sky-300 bg-white text-slate-800"}`}
                  >
                    <option>En ligne</option>
                    <option>Occupé</option>
                    <option>En réunion</option>
                    <option>Absent</option>
                  </select>
                  <LiquidMetalButton label="Changer" tinted width={86} height={30} fontSize={10} onClick={cyclePresence} />
                </div>
                <div className={`mt-1 text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{profileName}</div>
                <div className={`mt-1 text-lg font-semibold ${isDark ? "text-cyan-200" : "text-blue-700"}`}>{profileRole}</div>
                <div className={`mt-1 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>Cockpit futuriste de pilotage staff</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LiquidMetalButton label="Retour" tinted width={108} height={40} fontSize={12} onClick={() => (window.location.href = "/staff")} />
              <LiquidMetalButton label={theme === "dark" ? "Mode clair" : "Mode sombre"} tinted width={128} height={40} fontSize={12} onClick={toggleTheme} />
              <LiquidMetalButton label="Données" tinted width={118} height={40} fontSize={12} onClick={() => (window.location.href = "/staff/liquid-dash/data")} />
              <LiquidMetalButton
                label={showAllSections ? "Vue condensée" : "Afficher tout"}
                tinted
                width={136}
                height={40}
                fontSize={12}
                onClick={() => setShowAllSections((previous) => !previous)}
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="h-full border-white/10 bg-slate-950/35 backdrop-blur-2xl">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {SECTION_ITEMS.map((item) => (
                    <NavItem key={item.key} icon={item.icon} label={item.label} active={activeSection === item.key} onClick={() => jumpToSection(item.key)} />
                  ))}
                </nav>
                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="mb-2 font-mono text-xs text-slate-500">ÉTAT SYSTÈME</div>
                  <div className="space-y-3">
                    <StatusItem label="Systèmes centraux" value={systemStatus} color="cyan" />
                    <StatusItem label="Sécurité" value={securityLevel} color="blue" />
                    <StatusItem label="Réseau" value={networkStatus} color="indigo" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-9 lg:col-span-10 space-y-6">
            <section id="cockpit" className="space-y-6">
              <Card className={`overflow-hidden border backdrop-blur-2xl ${isDark ? "border-white/10 bg-slate-950/35" : "border-sky-200/65 bg-white/68"} shadow-[0_30px_90px_rgba(2,8,22,0.30)]`}>
                <CardContent className="p-0">
                  <div className={`pb-8 pt-12 ${isDark ? "bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.22),rgba(2,6,23,0.04)_65%)]" : "bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.20),rgba(255,255,255,0.40)_65%)]"}`}>
                    <div className="text-center">
                      <div className={`mb-3 font-mono text-[11px] uppercase tracking-[0.34em] ${isDark ? "text-slate-500" : "text-slate-600"}`}>HEURE SYSTÈME</div>
                      <div className={`font-mono text-7xl md:text-8xl leading-none ${isDark ? "text-cyan-300" : "text-blue-600"} ${hourFx ? "animate-pulse scale-[1.02]" : ""} drop-shadow-[0_0_42px_rgba(56,189,248,0.42)]`}>{formatTime(currentTime)}</div>
                      <div className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{formatDate(currentTime)} · {timezone}</div>
                    </div>
                  </div>
                  <div className={`grid grid-cols-2 gap-3 border-t p-4 md:grid-cols-4 ${isDark ? "border-white/[0.06]" : "border-sky-200/80"}`}>
                    <GlassMini label="Fuseau horaire" value={timezone} />
                    <GlassMini label="Tickets ouverts" value={String(openTickets)} />
                    <GlassMini label="Feedbacks nouveaux" value={String(feedbackNew)} />
                    <GlassMini label="Approbations" value={String(pendingApprovals)} />
                  </div>
                </CardContent>
              </Card>

              {/* ② Message équipe (profil central retiré pour éviter le doublon) */}
              {showAnnouncement && (
                <Card className="border-cyan-400/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(59,130,246,0.10),rgba(14,116,144,0.07))] backdrop-blur-2xl shadow-[0_16px_60px_rgba(14,165,233,0.12)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-cyan-100/90">Message équipe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-xs leading-6 text-sky-50/80 whitespace-pre-wrap max-h-44 overflow-y-auto">
                      {teamAnnouncement}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <LiquidMetalButton label={copiedAnnouncement ? "Copié ✓" : "Copier"} tinted width={120} height={38} fontSize={12} onClick={handleCopyAnnouncement} />
                      <LiquidMetalButton label="Chat équipe" tinted width={130} height={38} fontSize={12} onClick={() => (window.location.href = "/staff?view=chat")} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            <section id="overview">
              <Card className="overflow-hidden border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-slate-100">
                      <Activity className="mr-2 h-5 w-5 text-cyan-300" />
                      Vue d'ensemble
                    </CardTitle>
                    <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <MetricCard title="Charge CPU" value={cpuUsage} icon={Cpu} trend="up" detail={`${openTickets} tickets actifs`} />
                    <MetricCard title="Mémoire" value={memoryUsage} icon={HardDrive} trend="stable" detail={`${approvedMembers} membres approuvés`} />
                    <MetricCard title="Réseau" value={networkStatus} icon={Wifi} trend="down" detail={`${feedbackNew} feedbacks nouveaux`} />
                  </div>

                  <div className="mt-6 rounded-2xl border border-cyan-400/15 bg-[linear-gradient(130deg,rgba(14,165,233,0.16),rgba(59,130,246,0.10),rgba(20,184,166,0.06))] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/65">Focus Quotidien</div>
                        <p className="mt-2 text-sm font-semibold text-white/90 md:text-base">{dailyFocus}</p>
                      </div>
                      <div className="min-w-[180px]">
                        <div className="mb-1 text-xs text-cyan-100/65">Momentum équipe</div>
                        <div className="h-2 overflow-hidden rounded-full bg-black/25">
                          <div className="h-full rounded-full bg-gradient-to-r from-sky-200 via-cyan-300 to-blue-400" style={{ width: `${momentumScore}%` }} />
                        </div>
                        <div className="mt-1 text-xs font-semibold text-white/80">{momentumScore}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="console" className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <Card className={`border backdrop-blur-2xl shadow-[0_20px_60px_rgba(2,8,22,0.20)] ${isDark ? "border-white/10 bg-slate-950/35" : "border-sky-200/65 bg-white/68"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <Terminal className="mr-2 h-5 w-5 text-cyan-300" />
                    Console d&apos;actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 text-[9px] uppercase tracking-[0.28em] text-slate-500 font-semibold">Données &amp; Personnes</div>
                      <div className="grid grid-cols-4 gap-2">
                        <ActionButton label="Feedbacks" badge={feedbackNew || undefined} onClick={() => (window.location.href = "/staff?view=suggestions")} />
                        <ActionButton label="Équipe" badge={approvedMembers || undefined} onClick={() => (window.location.href = "/staff?view=team")} />
                        <ActionButton label="Analytiques" onClick={() => (window.location.href = "/staff?view=analytics")} />
                        <ActionButton label="Chat" onClick={() => (window.location.href = "/staff?view=chat")} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 text-[9px] uppercase tracking-[0.28em] text-slate-500 font-semibold">Gestion &amp; Accès</div>
                      <div className="grid grid-cols-4 gap-2">
                        <ActionButton label="Tickets" badge={openTickets || undefined} onClick={() => (window.location.href = "/staff?view=tickets")} />
                        <ActionButton label="Permissions" onClick={() => (window.location.href = "/staff?view=permissions")} />
                        <ActionButton label="Notifs" badge={pendingApprovals || undefined} onClick={() => (window.location.href = "/staff?view=notifications")} />
                        <ActionButton label="Organigramme" onClick={() => (window.location.href = "/staff?view=orgchart")} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 text-[9px] uppercase tracking-[0.28em] text-slate-500 font-semibold">Navigation &amp; IA</div>
                      <div className="grid grid-cols-4 gap-2">
                        <ActionButton label="Malaika IA" onClick={() => (window.location.href = "/staff/malaika")} />
                        <ActionButton label="Prévisualiser" onClick={() => (window.location.href = "/preview-staff")} />
                        <ActionButton label="Comptes" onClick={() => (window.location.href = "/admin")} />
                        <ActionButton label="Actualiser" onClick={() => window.location.reload()} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 text-[9px] uppercase tracking-[0.28em] text-slate-500 font-semibold">Contenus &amp; Espace</div>
                      <div className="grid grid-cols-4 gap-2">
                        <ActionButton label="Scripts" onClick={() => (window.location.href = "/admin/scripts-data")} />
                        <ActionButton label="Suggestions" badge={feedbackTotal || undefined} onClick={() => (window.location.href = "/admin/suggestions")} />
                        <ActionButton label="Espace membre" onClick={() => (window.location.href = "/espace")} />
                        <ActionButton label="Rejoindre" onClick={() => (window.location.href = "/rejoindre")} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-base text-slate-100">
                      <Activity className="mr-2 h-5 w-5 text-cyan-300" />
                      Journal d&apos;activité
                    </CardTitle>
                    <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px]">
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 font-mono text-xs space-y-2 max-h-56 overflow-y-auto">
                    {recentActions.length === 0 && <div className="text-slate-500 py-2 text-center">Aucune activité récente</div>}
                    {recentActions.map((action) => (
                      <div key={action.id} className="flex items-start gap-2">
                        <span className={`shrink-0 text-[10px] font-bold mt-0.5 ${action.type === "feedback" ? "text-cyan-400" : "text-sky-300"}`}>
                          {action.type === "feedback" ? "[FB]" : "[MB]"}
                        </span>
                        <span className="text-slate-300 flex-1 leading-5">{action.text}</span>
                        <span className="shrink-0 text-slate-600 text-[10px]">{action.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {showAllSections && (
              <>
            <section id="diagnostics" className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,1fr]">
              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <Cpu className="mr-2 h-5 w-5 text-cyan-300" />
                    Diagnostics administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatCard title="Approuvés" value={approvedProfiles.length + 1} subtitle="Équipe active" />
                    <StatCard title="En attente" value={pendingProfiles.length} subtitle="Validation" />
                    <StatCard title="Sans rôle" value={pendingRoleProfiles.length} subtitle="Affectation" />
                    <StatCard title="Refusés" value={rejectedProfiles.length} subtitle="Historique" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-3 text-sm font-semibold text-white">File de décisions prioritaires</div>
                    <div className="space-y-3">
                      {pendingProfiles.slice(0, 4).map((profile) => (
                        <ProfileRow key={profile.user_id} name={profile.full_name ?? profile.email ?? profile.user_id} subtitle={`${profile.role_name ?? "Rôle à confirmer"} · ${timeAgo(profile.created_at)}`} badge="En attente" />
                      ))}
                      {pendingProfiles.length === 0 && <div className="py-6 text-center text-sm text-slate-400">Aucune demande urgente.</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="security" className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base text-slate-100">
                    <span className="flex items-center"><Shield className="mr-2 h-5 w-5 text-cyan-300" />Sécurité &amp; accès</span>
                    <span className="text-xs text-slate-400">{profiles.length} profils</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "approved", "pending", "rejected"] as const).map((f) => (
                      <LiquidMetalButton
                        key={f}
                        label={f === "all" ? `Tous (${profiles.filter((p) => p.role_id !== "admin-supreme").length})` : f === "approved" ? `Approuvés (${approvedProfiles.length})` : f === "pending" ? `En attente (${pendingProfiles.length})` : `Refusés (${rejectedProfiles.length})`}
                        tinted
                        width={132}
                        height={32}
                        fontSize={11}
                        onClick={() => setSecurityFilter(f)}
                      />
                    ))}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredProfilesBySecurity.slice(0, 15).map((profile) => (
                      <div key={profile.user_id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.055]">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${hashColor(profile.user_id)}`}>{getInitials(profile.full_name, profile.email)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-white/85">{profile.full_name ?? profile.email ?? profile.user_id}</div>
                          <div className="text-[10px] text-slate-500">{profile.role_name ?? "Sans rôle"}</div>
                        </div>
                        <StatusPill status={profile.status} />
                      </div>
                    ))}
                    {filteredProfilesBySecurity.length === 0 && <div className="py-4 text-center text-xs text-slate-400">Aucun profil dans ce filtre</div>}
                  </div>
                  <div className="pt-1 space-y-2 border-t border-white/5">
                    <AlertItem title="Stabilité de la plateforme" time={formatTime(currentTime)} description={`${systemStatus}% de santé système sur les services critiques.`} type="success" />
                    <AlertItem title="Résolution feedbacks" time={formatTime(currentTime)} description={`${analytics.kpis.resolutionRate}% des retours sont résolus sur la période.`} type="info" />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="data-center" className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <Database className="mr-2 h-5 w-5 text-cyan-300" />
                    Centre de données RH
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-slate-400">Occupation des catégories</div>
                  {categoryStats.map((category) => {
                    const pct = category.total > 0 ? Math.round((category.count / category.total) * 100) : 0
                    return (
                      <div key={category.id}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{category.emoji}</span>
                            <span className="text-sm font-medium text-white/85">{category.name}</span>
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-cyan-100">{category.count}/{category.total}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Historique complet des membres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-white/35">
                          <th className="pb-3 pr-4">Membre</th>
                          <th className="pb-3 pr-4">Rôle</th>
                          <th className="pb-3 pr-4">Statut</th>
                          <th className="pb-3">Inscription</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {profiles.slice(0, 10).map((profile) => (
                          <tr key={profile.user_id} className="hover:bg-white/[0.03]">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white ${hashColor(profile.user_id)}`}>
                                  {getInitials(profile.full_name, profile.email)}
                                </div>
                                <span className="max-w-[180px] truncate text-white/80">{profile.full_name ?? profile.email ?? "-"}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-white/60">{profile.role_name ?? "-"}</td>
                            <td className="py-3 pr-4"><StatusPill status={profile.status} /></td>
                            <td className="py-3 text-xs text-white/35">{timeAgo(profile.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="network" className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,1fr]">
              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <Globe className="mr-2 h-5 w-5 text-cyan-300" />
                    Réseau de travail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <KpiTile label="Taux de résolution" value={analytics.kpis.resolutionRate} unit="%" sub={`${analytics.kpis.resolved} / ${analytics.kpis.total} feedbacks`} />
                    <KpiTile label="Total feedbacks" value={analytics.kpis.total} sub={`${analytics.kpis.newCount} nouveaux`} />
                    <KpiTile label="En cours" value={analytics.kpis.inProgress} sub="Traitement" />
                    <KpiTile label="Membres actifs" value={analytics.kpis.members} sub="Validés" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Volume de feedbacks</h3>
                        <p className="text-xs text-slate-400">{analyticsPeriod === "W" ? "Lecture quotidienne" : analyticsPeriod === "1M" ? "Lecture hebdomadaire" : "Lecture mensuelle"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["W", "1M", "3M", "6M", "1A"].map((period) => (
                          <LiquidMetalButton
                            key={period}
                            label={period === "W" ? "Semaine" : period}
                            tinted
                            width={84}
                            height={32}
                            fontSize={11}
                            onClick={() => setAnalyticsPeriod(period as PeriodKey)}
                          />
                        ))}
                      </div>
                    </div>
                    <BarChart data={analytics.series} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <Users className="mr-2 h-5 w-5 text-cyan-300" />
                    Équipe active
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {team.length > 0 ? team.map((member) => (
                    <ProfileRow
                      key={member.user_id}
                      name={member.full_name ?? member.email?.split("@")[0] ?? "Membre"}
                      subtitle={member.role_name ?? "Rôle en cours"}
                      avatar={getAvatar(member)}
                      initials={getInitials(member.full_name, member.email)}
                      badge="Actif"
                    />
                  )) : <div className="py-6 text-center text-sm text-slate-400">Aucun membre affiché</div>}
                </CardContent>
              </Card>
            </section>

            <section id="monark" className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <MonarkIcon size={20} className="mr-2" />
                    Monark · Résumé depuis le départ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {monarkHighlights.map((text, index) => (
                    <MonarkBubble key={text} index={index} text={text} />
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Lecture synthétique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.22em] text-sky-200/60">Répartition des feedbacks</div>
                    <DonutChart data={analytics.categories} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <StatusBlock label="Nouveaux" value={analytics.kpis.newCount} />
                    <StatusBlock label="En cours" value={analytics.kpis.inProgress} />
                    <StatusBlock label="Résolus" value={analytics.kpis.resolved} />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="communications" className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,0.95fr]">
              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <MessageSquare className="mr-2 h-5 w-5 text-cyan-300" />
                    Journal des communications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {communications.length > 0 ? communications.map((item) => (
                      <CommunicationItem key={item.id} sender={item.sender} time={item.time} message={item.message} avatar="/placeholder.svg?height=40&width=40" unread={item.unread} />
                    )) : (
                      <CommunicationItem sender="Système" time={formatTime(currentTime)} message="Aucune communication récente." avatar="/placeholder.svg?height=40&width=40" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-slate-100">
                    <Send className="mr-2 h-5 w-5 text-cyan-300" />
                    Diffuser à l&apos;équipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Objet de l&apos;annonce</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Ex: Mise à jour importante du cockpit"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Message</label>
                    <textarea
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      placeholder="Rédigez votre message pour toute l'équipe..."
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none"
                    />
                  </div>
                  {broadcastDone === "success" && (
                    <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Message diffusé avec succès à l&apos;équipe.
                    </div>
                  )}
                  {broadcastDone === "error" && (
                    <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Erreur lors de l&apos;envoi. Réessayez.
                    </div>
                  )}
                  <LiquidMetalButton
                    label={broadcastSending ? "Envoi en cours..." : "Diffuser à l'équipe"}
                    tinted
                    width={224}
                    height={44}
                    fontSize={13}
                    onClick={handleBroadcast}
                    disabled={broadcastSending || !broadcastTitle.trim() || !broadcastBody.trim()}
                  />
                </CardContent>
              </Card>
            </section>

            {/* ——————— SECTION MONITORING ——————— */}
            <section id="monitoring" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                <Zap className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-bold text-white">Monitoring &amp; Outils</h2>
                <span className="ml-auto text-xs text-slate-500">
                  {monitoringData ? "Données en temps réel" : "Chargement…"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                {/* ——— Sentry ——— */}
                <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-slate-100">
                      <span className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-cyan-300" />
                        Sentry
                      </span>
                      {monitoringData ? (
                        <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${monitoringData.sentry.connected ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-200" : "border-slate-500/25 bg-slate-500/10 text-slate-300"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${monitoringData.sentry.connected ? "bg-cyan-400 animate-pulse" : "bg-slate-500"}`} />
                          {monitoringData.sentry.connected ? "Connecté" : "Non configuré"}
                        </span>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!monitoringData?.sentry.connected ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
                        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-sky-400/60" />
                        Configurez les variables&nbsp;<code className="text-sky-300">SENTRY_AUTH_TOKEN</code>, <code className="text-sky-300">SENTRY_ORG</code>, <code className="text-sky-300">SENTRY_PROJECT</code> et <code className="text-sky-300">NEXT_PUBLIC_SENTRY_DSN</code> dans vos env Vercel.
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                          <span className="text-xs text-slate-400">DSN</span>
                          <span className="flex items-center gap-1.5 text-xs text-cyan-200">
                            <CheckCircle className="h-3 w-3" />
                            {monitoringData.sentry.dsnConfigured ? "Configuré" : "Manquant"}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mt-2">Erreurs non résolues</div>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                          {monitoringData.sentry.issues.length === 0 ? (
                            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-2.5 text-xs text-cyan-200">
                              <CheckCircle className="h-4 w-4 shrink-0 text-cyan-400" />
                              Aucune erreur non résolue 🎉
                            </div>
                          ) : monitoringData.sentry.issues.map((issue) => (
                            <div key={issue.id} className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2 hover:bg-white/[0.055]">
                              <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${issue.level === "error" || issue.level === "fatal" ? "bg-red-500/20 text-red-300" : issue.level === "warning" ? "bg-yellow-500/20 text-yellow-200" : "bg-sky-500/15 text-sky-300"}`}>
                                {issue.level}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs text-white/85">{issue.title}</div>
                                <div className="text-[10px] text-slate-500">{issue.count} occ. · {new Date(issue.lastSeen).toLocaleDateString("fr-FR")}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <a
                          href={`https://sentry.io/organizations/${process.env.NEXT_PUBLIC_SENTRY_ORG ?? ""}/issues/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200"
                        >
                          Voir dans Sentry <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* ——— Slack ——— */}
                <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-slate-100">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-cyan-300" />
                        Slack
                      </span>
                      {monitoringData && (
                        <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${monitoringData.slack.connected ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-200" : monitoringData.slack.fallbackMode ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-slate-500/25 bg-slate-500/10 text-slate-300"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${monitoringData.slack.connected ? "bg-cyan-400 animate-pulse" : monitoringData.slack.fallbackMode ? "bg-amber-400" : "bg-slate-500"}`} />
                          {monitoringData.slack.connected ? "Webhook actif" : monitoringData.slack.fallbackMode ? "Mode simulation" : "Non configuré"}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!monitoringData?.slack.connected && !monitoringData?.slack.fallbackMode ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
                        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-sky-400/60" />
                        Configurez la variable <code className="text-sky-300">SLACK_WEBHOOK_URL</code> dans vos env Vercel pour activer les notifications.
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-300 leading-5">Envoyer une notification test ou une annonce directe vers le channel Slack configuré.</p>
                        <textarea
                          value={slackTestMsg}
                          onChange={(e) => setSlackTestMsg(e.target.value)}
                          placeholder="Message test (optionnel)"
                          rows={3}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/40 focus:outline-none resize-none"
                        />
                        {slackResult === "success" && (
                          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            Message envoyé avec succès sur Slack.
                          </div>
                        )}
                        {slackResult === "error" && (
                          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Échec de l&apos;envoi. Vérifiez votre webhook URL.
                          </div>
                        )}
                        <LiquidMetalButton
                          label={slackSending ? "Envoi…" : "Envoyer notification test"}
                          tinted
                          width={220}
                          height={40}
                          fontSize={12}
                          onClick={handleSlackTest}
                          disabled={slackSending}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* ——— Cloudflare ——— */}
                <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-slate-100">
                      <span className="flex items-center gap-2">
                        <Cloud className="h-5 w-5 text-cyan-300" />
                        Cloudflare
                      </span>
                      {monitoringData && (
                        <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${monitoringData.cfConfigured ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-200" : monitoringData.cfFallbackMode ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-slate-500/25 bg-slate-500/10 text-slate-300"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${monitoringData.cfConfigured ? "bg-cyan-400 animate-pulse" : monitoringData.cfFallbackMode ? "bg-amber-400" : "bg-slate-500"}`} />
                          {monitoringData.cfConfigured ? "Connecté" : monitoringData.cfFallbackMode ? "Mode simulation" : "Non configuré"}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!monitoringData?.cloudflare ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
                        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-sky-400/60" />
                        Configurez <code className="text-sky-300">CLOUDFLARE_API_TOKEN</code> et <code className="text-sky-300">CLOUDFLARE_ZONE_ID</code> dans vos env Vercel.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Requêtes (7j)</div>
                            <div className="mt-1 text-xl font-bold tabular-nums text-white">{monitoringData.cloudflare.requests.all.toLocaleString("fr-FR")}</div>
                          </div>
                          <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] p-3">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cache hit</div>
                            <div className="mt-1 text-xl font-bold tabular-nums text-cyan-200">{monitoringData.cloudflare.requests.cacheHitRate}%</div>
                          </div>
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Bandwidth</div>
                            <div className="mt-1 text-base font-bold text-white">{monitoringData.cloudflare.bandwidth.all}</div>
                          </div>
                          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.04] p-3">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Menaces bloquées</div>
                            <div className="mt-1 text-xl font-bold tabular-nums text-red-300">{monitoringData.cloudflare.threats.toLocaleString("fr-FR")}</div>
                          </div>
                          <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pages vues / Visiteurs uniques</div>
                            <div className="mt-1 text-sm font-bold text-white">
                              {monitoringData.cloudflare.pageViews.toLocaleString("fr-FR")}{" "}
                              <span className="font-normal text-slate-400">/ {monitoringData.cloudflare.uniques.toLocaleString("fr-FR")}</span>
                            </div>
                          </div>
                        </div>
                        {cfPurgeResult === "success" && (
                          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            Cache Cloudflare purgé avec succès.
                          </div>
                        )}
                        {cfPurgeResult === "error" && (
                          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Échec de la purge. Vérifiez les permissions API.
                          </div>
                        )}
                        <LiquidMetalButton
                          label={cfPurging ? "Purge en cours…" : "Purger le cache CF"}
                          tinted
                          width={190}
                          height={38}
                          fontSize={12}
                          onClick={handleCfPurge}
                          disabled={cfPurging}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* ——— Monark Logs ——— */}
                <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base text-slate-100">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-cyan-300" />
                        Monark Logs
                      </span>
                      <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${monarkLogsError ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-cyan-500/25 bg-cyan-500/10 text-cyan-200"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${monarkLogsError ? "bg-red-400" : "bg-cyan-400 animate-pulse"}`} />
                        {monarkLogsError ? "Indisponible" : `${monarkLogCount} logs`}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                      <span className="text-xs text-slate-400">Webhook</span>
                      <span className={`text-xs ${monarkHasWebhook ? "text-cyan-200" : "text-slate-400"}`}>{monarkHasWebhook ? "Actif" : "Inactif"}</span>
                    </div>

                    {monarkLogsError ? (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        {monarkLogsError}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                        {monarkLogs.length === 0 ? (
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-xs text-slate-400 text-center">
                            Aucun log Monark pour le moment.
                          </div>
                        ) : monarkLogs.map((log) => (
                          <div key={log.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${log.type === "error" ? "bg-red-500/20 text-red-300" : log.type === "request" ? "bg-emerald-500/20 text-emerald-300" : log.type === "response" ? "bg-sky-500/20 text-sky-300" : log.type === "auth" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-cyan-500/20 text-cyan-300"}`}>{log.type}</span>
                              <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-300 truncate">{String((log.data?.url as string) ?? (log.data?.message as string) ?? "Événement Monark")}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <LiquidMetalButton
                        label={monarkLoading ? "Actualisation…" : "Actualiser"}
                        tinted
                        width={126}
                        height={36}
                        fontSize={11}
                        onClick={() => void fetchMonarkLogs()}
                        disabled={monarkLoading}
                      />
                      <LiquidMetalButton
                        label="Ouvrir API"
                        tinted
                        width={122}
                        height={36}
                        fontSize={11}
                        onClick={() => void openMonarkApi()}
                        disabled={!token}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="settings" className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-100">Allocation des ressources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProgressRow label="Puissance de calcul" value={cpuUsage} />
                  <ProgressRow label="Allocation mémoire" value={memoryUsage} />
                  <ProgressRow label="Bande passante réseau" value={networkStatus} />
                  <ProgressRow label="Capacité de résolution" value={analytics.kpis.resolutionRate} />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 backdrop-blur-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-100">Réglages visuels et travail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/80">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="font-semibold text-white">Palette unifiée</div>
                    <p className="mt-1 text-slate-300">Les cartes, graphiques et badges sont volontairement resserrés autour de nuances de cyan, bleu et ardoise pour rester professionnels.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="font-semibold text-white">Rendement de travail</div>
                    <p className="mt-1 text-slate-300">Le cockpit donne la priorité aux informations immédiatement actionnables, puis descend vers les historiques et les détails pour éviter la dispersion.</p>
                  </div>
                </CardContent>
              </Card>
            </section>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Retour en haut"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 left-5 z-[60] flex h-9 w-9 items-center justify-center rounded-full border text-white/90 shadow-[0_10px_28px_rgba(2,8,22,0.45)] backdrop-blur-xl transition-all duration-200 ${isDark ? "border-cyan-300/35 bg-cyan-500/20 hover:bg-cyan-500/30" : "border-sky-500/35 bg-sky-500/25 hover:bg-sky-500/35"} ${showScrollTop ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-90 opacity-0"}`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <MonarkQuickAssistant />
    </div>
  )
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <div className="w-full">
      <LiquidMetalButton
        label={label}
        tinted
        width={198}
        height={38}
        fontSize={12}
        onClick={onClick}
        className={active ? "ring-1 ring-cyan-300/35 rounded-xl" : ""}
      />
    </div>
  )
}

function StatusItem({ label, value, color }: { label: string; value: number; color: "cyan" | "blue" | "indigo" }) {
  const gradient = color === "indigo" ? "from-indigo-400 to-blue-600" : color === "blue" ? "from-blue-400 to-cyan-500" : "from-cyan-400 to-sky-500"
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <div className="text-slate-400">{label}</div>
        <div className="text-slate-400">{value}%</div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/70">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, trend, detail }: { title: string; value: number; icon: LucideIcon; trend: "up" | "down" | "stable"; detail: string }) {
  const trendIcon = trend === "up" ? <BarChart3 className="h-4 w-4 text-cyan-300" /> : trend === "down" ? <BarChart3 className="h-4 w-4 rotate-180 text-blue-300" /> : <LineChart className="h-4 w-4 text-sky-300" />
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-slate-400">{title}</div>
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="mb-1 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-2xl font-bold text-transparent">{value}%</div>
      <div className="text-xs text-slate-500">{detail}</div>
      <div className="absolute bottom-2 right-2">{trendIcon}</div>
    </div>
  )
}

function AlertItem({ title, time, description, type }: { title: string; time: string; description: string; type: "info" | "warning" | "success" | "update" }) {
  const icon = type === "warning" ? <AlertCircle className="h-3 w-3 text-sky-200" /> : type === "update" ? <Download className="h-3 w-3 text-cyan-300" /> : type === "success" ? <Shield className="h-3 w-3 text-blue-300" /> : <Shield className="h-3 w-3 text-cyan-300" />
  return (
    <div className="flex items-start space-x-3">
      <div className="mt-0.5 rounded-full border border-white/10 bg-white/[0.03] p-1">{icon}</div>
      <div>
        <div className="flex items-center">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          <div className="ml-2 text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </div>
  )
}

function CommunicationItem({ sender, time, message, avatar, unread }: { sender: string; time: string; message: string; avatar: string; unread?: boolean }) {
  return (
    <div className={`flex space-x-3 rounded-2xl p-3 ${unread ? "border border-cyan-500/12 bg-cyan-500/[0.06] shadow-[0_12px_26px_rgba(14,165,233,0.08)]" : "border border-white/8 bg-white/[0.03]"}`}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={avatar} alt={sender} />
        <AvatarFallback className="bg-slate-700 text-cyan-400">{sender.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-200">{sender}</div>
          <div className="text-xs text-slate-500">{time}</div>
        </div>
        <div className="mt-1 text-xs text-slate-400">{message}</div>
      </div>
    </div>
  )
}

function ActionButton({ label, onClick, badge }: { label: string; onClick?: () => void; badge?: number }) {
  return (
    <div className="relative flex justify-center">
      {!!badge && (
        <span className="pointer-events-none absolute -right-0.5 -top-1.5 z-20 min-w-[18px] h-[18px] rounded-full border border-cyan-300/30 bg-cyan-500 px-1 text-[9px] font-bold text-white shadow-[0_0_7px_rgba(14,165,233,0.65)] flex items-center justify-center tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <LiquidMetalButton label={label} tinted width={104} height={38} fontSize={11} onClick={onClick} />
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-400/10 to-blue-700/10 p-5 shadow-lg backdrop-blur-xl">
      <div className="mb-2 text-xs font-medium text-white/70">{title}</div>
      <div className="text-3xl font-bold tabular-nums text-white">{value}</div>
      <div className="mt-1 text-xs text-white/55">{subtitle}</div>
    </div>
  )
}

function KpiTile({ label, value, sub, unit = "" }: { label: string; value: number; sub: string; unit?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-indigo-700/10 p-4">
      <div className="mb-2 text-xs font-medium text-white/70">{label}</div>
      <div className="text-3xl font-bold tabular-nums text-white">{value}<span className="text-lg font-normal text-white/60">{unit}</span></div>
      <div className="mt-1 text-xs text-white/55">{sub}</div>
    </div>
  )
}

function StatusBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/14 to-blue-700/14 p-4 text-center text-white">
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs opacity-80">{label}</div>
    </div>
  )
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm text-slate-400">{label}</div>
        <div className="text-xs text-slate-300">{value}%</div>
      </div>
      <Progress value={value} className="h-2 bg-slate-800/70">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${value}%` }} />
      </Progress>
    </div>
  )
}

function GlassMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="text-sm font-mono text-slate-200">{value}</div>
    </div>
  )
}

function ProfileRow({ name, subtitle, avatar, initials, badge }: { name: string; subtitle: string; avatar?: string | null; initials?: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-2 last:border-0">
      {avatar ? (
        <Image src={avatar} alt={name} width={40} height={40} sizes="40px" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-white">{initials ?? name.charAt(0)}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white/90">{name}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
      {badge && <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-100 border border-cyan-500/15">{badge}</span>}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-cyan-500/10 text-cyan-100 border-cyan-500/15",
    pending_approval: "bg-sky-500/10 text-sky-100 border-sky-500/15",
    pending_role: "bg-blue-500/10 text-blue-100 border-blue-500/15",
    rejected: "bg-slate-500/10 text-slate-200 border-slate-500/15",
  }
  const labels: Record<string, string> = {
    approved: "Approuvé",
    pending_approval: "En attente",
    pending_role: "Sans rôle",
    rejected: "Refusé",
  }
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${map[status] ?? map.rejected}`}>{labels[status] ?? status}</span>
}

function WorkflowItem({ title, description, status }: { title: string; description: string; status: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100">{status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  )
}

function MonarkBubble({ text, index }: { text: string; index: number }) {
  return (
    <div className={`max-w-[92%] rounded-[1.7rem] border px-4 py-3 text-sm leading-6 text-white/90 shadow-[0_18px_46px_rgba(2,8,22,0.22)] backdrop-blur-2xl ${index % 2 === 0 ? "border-cyan-400/15 bg-[linear-gradient(145deg,rgba(56,189,248,0.16),rgba(255,255,255,0.05),rgba(12,26,56,0.28))] rounded-bl-sm" : "ml-auto border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(14,165,233,0.10),rgba(12,26,56,0.26))] rounded-br-sm"}`}>
      {text}
    </div>
  )
}
