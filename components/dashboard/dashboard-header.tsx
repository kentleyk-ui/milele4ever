'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Bell, 
  Settings, 
  BookOpen,
  Heart,
  Calendar,
  FileText,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { User } from "@supabase/supabase-js"

interface DashboardHeaderProps {
  user: User
  profile: {
    full_name?: string
    avatar_url?: string
  } | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
    { href: "/dashboard", label: t('dashboard.overview'), icon: LayoutDashboard },
    { href: "/dashboard/memorials", label: t('dashboard.myMemorials'), icon: Heart },
    { href: "/dashboard/messages", label: t('dashboard.messages'), icon: MessageSquare },
    { href: "/dashboard/journal", label: t('dashboard.journal'), icon: BookOpen },
    { href: "/dashboard/calendar", label: t('dashboard.calendar'), icon: Calendar },
    { href: "/dashboard/heritage", label: t('dashboard.heritage'), icon: FileText },
    { href: "/dashboard/notifications", label: t('dashboard.notifications'), icon: Bell },
    { href: "/malaika", label: "Malaika", icon: Sparkles, special: true },
    { href: "/dashboard/settings", label: t('dashboard.settings'), icon: Settings },
  ]

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a1a0e] border-b border-primary/10 z-50 flex items-center justify-between px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Heart className="h-4 w-4 text-primary" fill="currentColor" />
        </div>
        <span className="font-serif font-bold text-lg text-white">Milele</span>
      </Link>

      {/* Mobile Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 bg-[#0a1a0e] border-l border-primary/10 p-0">
          <div className="p-6 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">
                  {profile?.full_name || "Utilisateur"}
                </p>
                <p className="text-sm text-white/50">{user.email}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
