"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, BookOpen, Lock, Mail, PenLine,
  ScrollText, Image, Users, ArrowLeft, Heart, User, LogOut, Grid3X3, FolderPlus, Search,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { AION_MODULES } from "@/types/aion"

const ICON_MAP: Record<string, React.ElementType> = {
  mon_histoire: BookOpen,
  coffre_fort: Lock,
  capsules: Mail,
  journal: PenLine,
  volontes: ScrollText,
  souvenirs: Image,
}

export default function AionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/inscription?redirect=/aion")
      } else {
        setAuthed(true)
      }
      setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent border-t-current animate-spin"
            style={{ borderTopColor: "var(--primary)" }}
          />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Vérification…</p>
        </div>
      </div>
    )
  }

  if (!authed) return null

  const isRoot = pathname === "/aion"

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/")
  }

  const navItems = [
    { href: "/aion", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/espace/profil", label: "Profil", icon: User, exact: false },
    { href: "/espace", label: "Créer un dossier", icon: FolderPlus, exact: false },
    ...AION_MODULES.map((m) => ({
      href: m.href,
      label: m.label,
      icon: ICON_MAP[m.key] ?? LayoutDashboard,
      exact: false,
    })),
    { href: "/aion/cercle", label: "Mon Cercle", icon: Users, exact: false },
    { href: "/aion/recherche", label: "Recherche", icon: Search, exact: false },
  ]

  const mobilePrimaryNavItems = [
    { href: "/aion", label: "Tableau", icon: LayoutDashboard, exact: true },
    { href: "/espace/profil", label: "Profil", icon: User, exact: false },
    { href: "/aion/capsules", label: "Capsules", icon: Mail, exact: false },
    { href: "/aion/cercle", label: "Cercle", icon: Users, exact: false },
  ]

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div
      className="page-surface min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* ─── Top bar ─── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
        style={{
          background: "color-mix(in srgb, var(--background) 80%, transparent)",
          backdropFilter: "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          borderBottom: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/espace/profil"
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors touch-manipulation"
            style={{ background: "var(--secondary)", color: "var(--primary)", minWidth: 36, minHeight: 36 }}
            aria-label="Retour à l'espace"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <Heart size={16} style={{ color: "var(--primary)" }} />
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Aïon
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--secondary)", color: "var(--primary)" }}
            >
              αἰών
            </span>
          </div>
        </div>

        {/* Desktop nav (md+) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? "var(--secondary)" : "transparent",
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            color: "#ef4444",
            background: "color-mix(in srgb, #ef4444 10%, transparent)",
          }}
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </header>

      {/* ─── Main content ─── */}
      <main
        className="pb-24 md:pb-8"
        style={{ minHeight: "calc(100dvh - 57px)" }}
      >
        {children}
      </main>

      {/* ─── Mobile bottom nav ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2"
        style={{
          background: "color-mix(in srgb, var(--background) 92%, transparent)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          borderTop: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))",
          paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
          paddingTop: 6,
        }}
      >
        {mobilePrimaryNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all touch-manipulation"
              style={{
                color: active ? "var(--primary)" : "var(--muted-foreground)",
                minWidth: 44, minHeight: 44,
              }}
            >
              <div
                className="relative w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-300"
                style={{
                  background: active ? "color-mix(in srgb, var(--primary) 15%, var(--secondary))" : "transparent",
                  boxShadow: active ? "0 0 8px color-mix(in srgb, var(--primary) 30%, transparent)" : "none",
                }}
              >
                <Icon size={16} />
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--primary)", boxShadow: "0 0 4px var(--primary)" }} />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none max-w-[52px] text-center truncate"
                style={{ fontWeight: active ? 700 : 500 }}>
                {item.label.split(" ")[0]}
              </span>
            </Link>
          )
        })}
        <button
          onClick={() => setMobileMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all touch-manipulation"
          style={{ color: "var(--muted-foreground)", minWidth: 44, minHeight: 44 }}
          aria-label="Plus"
        >
          <div
            className="relative w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
          >
            <Grid3X3 size={16} />
          </div>
          <span className="text-[10px] font-medium leading-none">Plus</span>
        </button>
      </nav>

      {mobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute left-0 right-0 bottom-0 rounded-t-2xl p-4"
            style={{
              background: "var(--background)",
              borderTop: "1px solid color-mix(in srgb, var(--primary) 14%, var(--border))",
              paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Navigation Aion</p>
              <button
                onClick={() => setMobileMoreOpen(false)}
                className="text-xs px-2 py-1 rounded"
                style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={`more-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{
                      color: active ? "var(--primary)" : "var(--foreground)",
                      background: active
                        ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                        : "var(--card)",
                      border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))",
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <button
              onClick={async () => {
                await handleSignOut()
                setMobileMoreOpen(false)
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{
                color: "#ef4444",
                background: "color-mix(in srgb, #ef4444 10%, transparent)",
                border: "1px solid color-mix(in srgb, #ef4444 20%, transparent)",
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
