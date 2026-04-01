'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Bell, 
  Settings, 
  BookOpen,
  Heart,
  Calendar,
  FileText,
  LogOut,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"

interface DashboardSidebarProps {
  user: User
  profile: {
    full_name?: string
    avatar_url?: string
  } | null
}

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
    {
      href: "/dashboard",
      label: t('dashboard.overview'),
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/memorials",
      label: t('dashboard.myMemorials'),
      icon: Heart,
    },
    {
      href: "/dashboard/messages",
      label: t('dashboard.messages'),
      icon: MessageSquare,
    },
    {
      href: "/dashboard/journal",
      label: t('dashboard.journal'),
      icon: BookOpen,
    },
    {
      href: "/dashboard/calendar",
      label: t('dashboard.calendar'),
      icon: Calendar,
    },
    {
      href: "/dashboard/heritage",
      label: t('dashboard.heritage'),
      icon: FileText,
    },
    {
      href: "/dashboard/notifications",
      label: t('dashboard.notifications'),
      icon: Bell,
    },
    {
      href: "/malaika",
      label: "Malaika",
      icon: Sparkles,
      special: true,
    },
  ]

  const bottomItems = [
    {
      href: "/dashboard/settings",
      label: t('dashboard.settings'),
      icon: Settings,
    },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[#0a1a0e] border-r border-primary/10 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-primary/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          </div>
          <span className="font-serif font-bold text-xl text-white">Milele</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
                item.special && "bg-gradient-to-r from-primary/10 to-yellow-500/10 border border-primary/20"
              )}
            >
              <item.icon className={cn("h-5 w-5", item.special && "text-yellow-500")} />
              {item.label}
              {item.special && (
                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                  AI
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-primary/10 space-y-2">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}

        {/* User Profile */}
        <div className="flex items-center gap-3 px-4 py-3 mt-4 rounded-xl bg-white/5">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name || "Utilisateur"}
            </p>
            <p className="text-xs text-white/50 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
