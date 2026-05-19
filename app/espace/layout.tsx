"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { DossierProvider, useDossier } from "@/lib/dossier-context"
import { supabase } from "@/lib/supabaseClient"
import {
  ClipboardList,
  FileText,
  Users,
  Users2,
  LayoutDashboard,
  Heart,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
  User,
  Bell,
} from "lucide-react"
import dynamic from "next/dynamic"

const AudioPlayerWrapper = dynamic(() => import("@/components/AudioPlayerWrapper"), { ssr: false })

/* ═══ Nav items ═══ */
const navItems = [
  { href: "/espace", label: "Tableau de bord", icon: LayoutDashboard, requiresAuth: false },
  { href: "/espace/profil", label: "Profil", icon: User, requiresAuth: false },
  { href: "/espace/checklist", label: "Checklist", icon: ClipboardList, requiresAuth: false },
  { href: "/espace/documents", label: "Documents", icon: FileText, requiresAuth: false },
  { href: "/espace/contacts", label: "Contacts", icon: Users, requiresAuth: false },
  { href: "/espace/membres", label: "Membres", icon: Users2, requiresAuth: true },
]

function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasDossier } = useDossier()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string; id: string } | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<Array<{
    id: string; actor_name: string; type: "like" | "comment";
    publication_preview: string | null; read: boolean; created_at: string
  }>>([])
  const [canAccessStaff, setCanAccessStaff] = useState(false)

  async function refreshStaffAccess(currentUser: { id: string; email: string } | null) {
    if (!currentUser) {
      setCanAccessStaff(false)
      return
    }

    if (currentUser.email.toLowerCase() === "kentleyk@gmail.com") {
      setCanAccessStaff(true)
      return
    }

    const { data: staffProfile } = await supabase
      .from("staff_profiles")
      .select("status")
      .eq("user_id", currentUser.id)
      .maybeSingle()

    const status = (staffProfile as { status?: string } | null)?.status ?? null
    setCanAccessStaff(status === "approved" || status === "pending_role")
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) {
        const currentUser = {
          id: u.id,
          email: u.email ?? "",
          name: u.user_metadata?.display_name ?? u.email?.split("@")[0] ?? "Membre",
        }
        setUser(currentUser)
        void refreshStaffAccess({ id: currentUser.id, email: currentUser.email })
      } else {
        setCanAccessStaff(false)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user
      if (!u) {
        setUser(null)
        setCanAccessStaff(false)
        return
      }

      const currentUser = {
        id: u.id,
        email: u.email ?? "",
        name: u.user_metadata?.display_name ?? u.email?.split("@")[0] ?? "Membre",
      }
      setUser(currentUser)
      void refreshStaffAccess({ id: currentUser.id, email: currentUser.email })
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Charger + écouter en realtime les demandes de connexion en attente
  useEffect(() => {
    if (!user) { setPendingCount(0); return }

    const loadPending = async () => {
      const { count } = await supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("target_id", user.id)
        .eq("status", "pending")
      setPendingCount(count ?? 0)
    }
    void loadPending()

    const channel = supabase
      .channel(`pending-badge:${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "connections",
        filter: `target_id=eq.${user.id}`,
      }, () => { void loadPending() })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user])

  // Charger + écouter en realtime les notifications non lues
  useEffect(() => {
    if (!user) { setNotifCount(0); setNotifs([]); return }

    const loadNotifs = async () => {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) return
      const json = (await res.json()) as { notifications: typeof notifs }
      setNotifs(json.notifications ?? [])
      setNotifCount((json.notifications ?? []).filter((n) => !n.read).length)
    }
    void loadNotifs()

    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => { void loadNotifs() })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user])

  const markAllRead = async () => {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) return
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setNotifCount(0)
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="page-surface">
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{
          background: "color-mix(in srgb, var(--background) 75%, transparent)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))",
        }}
      >
        <Link href="/espace/profil" className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--primary)" }}>
          <Heart size={18} />
          Milele
        </Link>
        <div className="flex items-center gap-2">
          {/* Cloche notifications mobile */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && notifCount > 0) void markAllRead() }}
                className="relative p-2 rounded-lg"
                style={{ color: "var(--foreground)" }}
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-10 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="px-4 py-3 text-xs font-semibold" style={{ borderBottom: "1px solid var(--border)", color: "var(--foreground)" }}>
                    Notifications
                  </div>
                  {notifs.length === 0 ? (
                    <p className="px-4 py-6 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>Aucune notification</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {notifs.map((n) => (
                        <div key={n.id} className="px-4 py-3 flex gap-3 items-start"
                          style={{
                            background: n.read ? "transparent" : "color-mix(in srgb, var(--primary) 6%, var(--card))",
                            borderBottom: "1px solid var(--border)",
                          }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                            style={{ background: "var(--secondary)" }}>
                            {n.type === "like" ? "❤️" : "💬"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs" style={{ color: "var(--foreground)" }}>
                              <span className="font-semibold">{n.actor_name}</span>
                              {n.type === "like" ? " a aimé" : " a commenté"}
                              {n.publication_preview ? ` "${n.publication_preview.slice(0, 40)}…"` : " votre publication"}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                              {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href="/espace/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="block px-4 py-2.5 text-center text-xs font-medium hover:opacity-80 transition-colors"
                    style={{ borderTop: "1px solid var(--border)", color: "var(--primary)" }}>
                    Voir toutes →
                  </Link>
                </div>
              )}
            </div>
          )}
          {canAccessStaff && (
            <Link
              href="/staff"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border"
              style={{ color: "var(--primary)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
            >
              <Shield size={14} />
              Staff
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg" style={{ color: "var(--foreground)" }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-14" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <nav className="relative p-4 flex flex-col gap-1" style={{ background: "var(--background)" }}>
            {navItems.map(item => {
              const active = pathname === item.href
              const needsAuth = item.requiresAuth && !user
              const disabled = (!hasDossier && item.href !== "/espace" && !item.requiresAuth)
              return (
                <Link
                  key={item.href}
                  href={disabled || needsAuth ? "#" : item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active ? "" : (disabled || needsAuth) ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"
                  }`}
                  style={{
                    background: active ? "var(--secondary)" : "transparent",
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  <item.icon size={18} />
                  {item.label}
                  {needsAuth && <LogIn size={12} className="ml-auto opacity-50" />}
                  {!needsAuth && item.href === "/espace/membres" && pendingCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}
            <div className="my-2" style={{ borderTop: "1px solid var(--border)" }} />
            <Link
              href={pathname.startsWith("/espace/profil") ? "/aion" : "/espace/profil"}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {pathname.startsWith("/espace/profil") ? <LayoutDashboard size={18} /> : <User size={18} />}
              {pathname.startsWith("/espace/profil") ? "Aion" : "Profil"}
            </Link>
            {canAccessStaff && (
              <Link href="/staff" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border"
                style={{ color: "var(--primary)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
              >
                <Shield size={18} />
                Retour staff
              </Link>
            )}
            {user && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  setMobileOpen(false)
                  router.replace("/")
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full"
                style={{ color: "#ef4444", background: "color-mix(in srgb, #ef4444 8%, transparent)" }}
              >
                <LogOut size={18} />
                Se déconnecter
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-30"
        style={{
          background: "color-mix(in srgb, var(--sidebar) 80%, transparent)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderRight: "1px solid color-mix(in srgb, var(--primary) 8%, var(--sidebar-border))",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16" style={{ borderBottom: "1px solid color-mix(in srgb, var(--primary) 8%, var(--sidebar-border))" }}>
          <Heart size={20} style={{ color: "var(--primary)" }} />
          <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Milele</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
            style={{ background: "var(--secondary)", color: "var(--primary)" }}
          >
            Espace
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => {
            const active = pathname === item.href
            const needsAuth = item.requiresAuth && !user
            const disabled = (!hasDossier && item.href !== "/espace" && !item.requiresAuth)
            return (
              <Link
                key={item.href}
                href={disabled || needsAuth ? "#" : item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  active ? "" : (disabled || needsAuth) ? "opacity-35 cursor-not-allowed" : "hover:opacity-80"
                }`}
                style={{
                  background: active ? "var(--sidebar-accent)" : "transparent",
                  color: active ? "var(--primary)" : "var(--sidebar-foreground)",
                }}
              >
                <item.icon size={17} strokeWidth={active ? 2 : 1.5} />
                {item.label}
                {needsAuth && <LogIn size={11} className="ml-auto opacity-40" />}
                {!needsAuth && item.href === "/espace/membres" && pendingCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Notifications desktop */}
        {user && (
          <div className="px-3 pb-2">
            <button
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && notifCount > 0) void markAllRead() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:opacity-80 relative"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              <Bell size={17} strokeWidth={1.5} />
              Notifications
              {notifCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute left-64 bottom-24 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="px-4 py-3 text-xs font-semibold" style={{ borderBottom: "1px solid var(--border)", color: "var(--foreground)" }}>
                  Notifications
                </div>
                {notifs.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>Aucune notification pour l'instant</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.map((n) => (
                      <div key={n.id} className="px-4 py-3 flex gap-3 items-start"
                        style={{
                          background: n.read ? "transparent" : "color-mix(in srgb, var(--primary) 6%, var(--card))",
                          borderBottom: "1px solid var(--border)",
                        }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                          style={{ background: "var(--secondary)" }}>
                          {n.type === "like" ? "❤️" : "💬"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs" style={{ color: "var(--foreground)" }}>
                            <span className="font-semibold">{n.actor_name}</span>
                            {n.type === "like" ? " a aimé" : " a commenté"}
                            {n.publication_preview ? ` "${n.publication_preview.slice(0, 50)}…"` : " votre publication"}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                            {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/espace/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="block px-4 py-2.5 text-center text-xs font-medium transition-colors hover:opacity-80"
                  style={{ borderTop: "1px solid var(--border)", color: "var(--primary)" }}>
                  Voir toutes les notifications →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Bottom */}
        <div className="px-3 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid color-mix(in srgb, var(--primary) 8%, var(--sidebar-border))" }}>
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--secondary)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate" style={{ color: "var(--foreground)" }}>{user.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>{user.email}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.replace("/")
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-all hover:opacity-80"
                style={{ color: "#ef4444", background: "color-mix(in srgb, #ef4444 8%, transparent)" }}
              >
                <LogOut size={15} />
                Se déconnecter
              </button>
            </>
          ) : (
            <Link href="/espace/membres" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:opacity-80 border"
              style={{ color: "var(--primary)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
            >
              <LogIn size={15} />
              Se connecter
            </Link>
          )}
          <Link href={pathname.startsWith("/espace/profil") ? "/aion" : "/espace/profil"} className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:opacity-80"
            style={{ color: "var(--muted-foreground)" }}
          >
            {pathname.startsWith("/espace/profil") ? <LayoutDashboard size={16} /> : <User size={16} />}
            {pathname.startsWith("/espace/profil") ? "Aion" : "Profil"}
          </Link>
          {canAccessStaff && (
            <Link href="/staff" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:opacity-80 border"
              style={{ color: "var(--primary)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
            >
              <Shield size={16} />
              Retour staff
            </Link>
          )}
        </div>
      </aside>
    </div>
  )
}

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <DossierProvider>
      <div className="page-surface min-h-screen" style={{ background: "var(--background)" }}>
        <Link
          href={pathname.startsWith("/espace/profil") ? "/aion" : "/espace/profil"}
          className="fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border backdrop-blur-xl"
          style={{
            color: "var(--muted-foreground)",
            borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)",
            background: "color-mix(in srgb, var(--card) 75%, transparent)",
          }}
        >
          {pathname.startsWith("/espace/profil") ? <LayoutDashboard size={16} /> : <User size={16} />}
          {pathname.startsWith("/espace/profil") ? "Aion" : "Profil"}
        </Link>

        <main className="min-h-screen overscroll-contain">
          {children}
        </main>
        <AudioPlayerWrapper />
      </div>
    </DossierProvider>
  )
}
