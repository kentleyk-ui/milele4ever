'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import {
  LayoutDashboard,
  FileText,
  Search,
  Shield,
  ScrollText,
  ClipboardCheck,
  Scale,
} from 'lucide-react'

export function LegalNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
    { href: '/legal', label: t('legal.dashboard'), icon: LayoutDashboard },
    { href: '/legal/contracts', label: t('legal.contracts'), icon: FileText },
    { href: '/legal/review', label: t('legal.review'), icon: Search },
    { href: '/legal/due-diligence', label: t('legal.dueDiligence'), icon: ClipboardCheck },
    { href: '/legal/privacy', label: t('legal.privacy'), icon: Shield },
    { href: '/legal/terms', label: t('legal.terms'), icon: ScrollText },
  ]

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">{t('legal.title')}</h1>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/legal' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-2 pb-2 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/legal' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </header>
  )
}
