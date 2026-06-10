'use client'

import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'

export function LegalFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-border py-6 px-4 mt-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}
          </p>
          <p className="text-xs text-muted-foreground/70">
            <span className="font-medium">Kent Ley</span> — Founder & CEO
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
            {t('legal.privacy')}
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">
            {t('legal.terms')}
          </Link>
          <Link href="/" className="hover:text-foreground transition-colors">
            {t('landing.title')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
