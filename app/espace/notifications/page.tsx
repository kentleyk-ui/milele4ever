"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Bell, BellOff, Check, CheckCheck, Heart, MessageCircle, ArrowLeft, UserPlus } from "lucide-react"

type Notif = {
  id: string
  type: "like" | "comment" | "connection" | string
  actor_name: string | null
  publication_preview: string | null
  read: boolean
  created_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

const TYPE_CONFIG = {
  like: { icon: Heart, color: "#EF4444", label: "a aimé votre publication" },
  comment: { icon: MessageCircle, color: "#3B82F6", label: "a commenté votre publication" },
  connection: { icon: UserPlus, color: "#10B981", label: "souhaite se connecter avec vous" },
  feedback_resolved: { icon: Check, color: "#22C55E", label: "a résolu votre suggestion" },
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [token, setToken] = useState("")

  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/espace/membres"); return }
      setToken(session.access_token)
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json() as { notifications: Notif[] }
        setNotifs(json.notifications ?? [])
      }
      setLoading(false)
    })()
  }, [router])

  const markAllRead = async () => {
    if (!token) return
    setMarkingAll(true)
    await supabase.from("notifications").update({ read: true }).eq("read", false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setMarkingAll(false)
  }

  const markOneRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--background)" }}>
      {/* Header sticky */}
      <div className="sticky top-0 z-10 px-4 h-14 flex items-center gap-3"
        style={{ background: "color-mix(in srgb, var(--background) 88%, transparent)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: "var(--foreground)" }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            <CheckCheck size={13} />
            Tout lire
          </button>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <BellOff size={40} style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucune notification pour l&apos;instant</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.like
              const Icon = cfg.icon
              return (
                <button key={n.id} onClick={() => void markOneRead(n.id)}
                  className="w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: n.read ? "transparent" : "color-mix(in srgb, var(--primary) 6%, var(--card))",
                    border: `1px solid ${n.read ? "transparent" : "color-mix(in srgb, var(--primary) 14%, var(--border))"}`,
                  }}>
                  {/* Icône type */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: `color-mix(in srgb, ${cfg.color} 15%, var(--secondary))` }}>
                    <Icon size={15} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>
                      <span className="font-semibold">{n.actor_name ?? "Quelqu'un"}</span>
                      {" "}{cfg.label}
                    </p>
                    {n.publication_preview && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted-foreground)" }}>
                        &ldquo;{n.publication_preview}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                      style={{ background: "var(--primary)" }} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
