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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="flex h-13 items-center justify-between px-4 gap-2">
        {/* Logo */}
        <Link href="/legal" className="flex items-center gap-2 shrink-0 group">
          <div className="relative">
            <Scale className="w-5 h-5 text-primary transition-all group-hover:text-glow" />
            <div className="absolute inset-0 w-5 h-5 text-primary blur-md opacity-0 group-hover:opacity-60 transition-opacity">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <span className="font-bold tracking-widest text-sm uppercase text-foreground hidden sm:block">
            Lex<span className="text-primary">Draft</span>
          </span>
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
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide uppercase transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 h-7 px-2 text-xs font-mono uppercase tracking-wider border border-transparent hover:border-primary/20">
                <Globe className="w-3.5 h-3.5" />
                {language}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[130px] border-border/50 bg-background/90 backdrop-blur-xl">
              <DropdownMenuItem
                onClick={() => setLanguage('fr')}
                className={cn('text-xs', language === 'fr' && 'text-primary bg-primary/10')}
              >
                🇫🇷 Français
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={cn('text-xs', language === 'en' && 'text-primary bg-primary/10')}
              >
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav */}
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
                'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap uppercase tracking-wide font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              )}
            >
              <item.icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </header>
  )
}
