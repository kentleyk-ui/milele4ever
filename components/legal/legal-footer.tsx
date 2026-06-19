'use client'

import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { Scale } from 'lucide-react'

export function LegalFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-border/40 mt-8">
      {/* Top glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="px-4 py-6 max-w-6xl mx-auto space-y-4">
        <p className="text-xs text-muted-foreground/60 text-center">
          {t('footer.disclaimer')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo + rights */}
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-xs font-bold tracking-widest uppercase text-foreground/80">
              Lex<span className="text-primary/80">Draft</span>
            </span>
            <span className="text-xs text-muted-foreground/50">
              · {t('footer.rights').replace('{year}', year.toString())}
            </span>
          </div>

          {/* Founder */}
          <p className="text-xs text-muted-foreground/50 font-mono tracking-wider">
            {t('footer.founder')}
          </p>

          {/* Links */}
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="text-xs text-muted-foreground/50 hover:text-primary transition-colors tracking-wide uppercase">
              {t('footer.privacy')}
            </Link>
            <Link href="/legal/terms" className="text-xs text-muted-foreground/50 hover:text-primary transition-colors tracking-wide uppercase">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
