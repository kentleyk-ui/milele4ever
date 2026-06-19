'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  FileText,
  Search,
  Shield,
  ScrollText,
  ClipboardCheck,
  Scale,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LegalNav() {
  const pathname = usePathname()
  const { t, language, setLanguage } = useI18n()

  const navItems = [
    { href: '/legal', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/legal/contracts', label: t('nav.contracts'), icon: FileText },
    { href: '/legal/review', label: t('nav.review'), icon: Search },
    { href: '/legal/due-diligence', label: t('nav.dueDiligence'), icon: ClipboardCheck },
    { href: '/legal/privacy', label: t('nav.privacy'), icon: Shield },
    { href: '/legal/terms', label: t('nav.terms'), icon: ScrollText },
  ]

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-14 items-center justify-between px-4 gap-2">
        {/* Logo */}
        <Link href="/legal" className="flex items-center gap-2 shrink-0">
          <Scale className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground hidden sm:block">{t('app.name')}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem
                onClick={() => setLanguage('fr')}
                className={cn(language === 'fr' && 'bg-primary/10 text-primary')}
              >
                🇫🇷 Français
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={cn(language === 'en' && 'bg-primary/10 text-primary')}
              >
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav — scrollable */}
      <div className="lg:hidden flex items-center gap-0.5 overflow-x-auto px-2 pb-2 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
