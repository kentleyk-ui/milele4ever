'use client'

import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import { Scale } from 'lucide-react'

export function LegalFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border py-6 px-4 mt-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground/80 text-center">
          {t('footer.disclaimer')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo + founder */}
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{t('app.name')}</span>
              {' · '}
              {t('footer.rights').replace('{year}', year.toString())}
            </div>
          </div>

          {/* Founder */}
          <p className="text-xs text-muted-foreground/70 italic">
            {t('footer.founder')}
          </p>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
