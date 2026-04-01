'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { CurrencySwitcher } from "@/components/currency-switcher"
import { useI18n } from "@/lib/i18n/context"
import { Home } from "lucide-react"

export function LandingHeader() {
  const { t } = useI18n()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {!isHomePage && (
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link href="/" aria-label={t('common.back', 'Retour')}>
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <Link href="/" className="flex items-center space-x-2 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-8 w-8 heart-logo-glow"
            >
              <defs>
                <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="50%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#166534" />
                </linearGradient>
              </defs>
              <path 
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                fill="url(#heart-gradient)"
              />
            </svg>
            <span className="font-serif font-semibold text-xl tracking-wide">Milele</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/about">{t('landing.about', 'A propos')}</Link>
          </Button>
          <CurrencySwitcher />
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/auth/login">{t('landing.login')}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/sign-up">{t('auth.signup')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
