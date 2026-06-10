'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { CurrencySwitcher } from "@/components/currency-switcher"

export function LandingHeader() {
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center space-x-2 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-8 w-8"
            >
              <path 
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                fill="#16a34a"
              />
            </svg>
            <span className="font-serif font-semibold text-xl tracking-wide">Milele</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/about">{t('landing.about', 'A propos')}</Link>
          </Button>
          <CurrencySwitcher />
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm">
            <Link href="/auth/login">{t('landing.login', 'Se connecter')}</Link>
          </Button>
          <Button size="sm">
            <Link href="/auth/sign-up">{t('auth.signup', 'S\'inscrire')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
