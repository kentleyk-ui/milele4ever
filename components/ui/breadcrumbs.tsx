'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  const { t } = useI18n()
  
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        {showHome && (
          <li className="flex items-center">
            <Link 
              href="/app" 
              className="flex items-center gap-1 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
              aria-label={t('app.feed')}
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">{t('app.feed')}</span>
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
          </li>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.label} className="flex items-center">
              {item.href && !isLast ? (
                <>
                  <Link 
                    href={item.href}
                    className="hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
                </>
              ) : (
                <span className="text-foreground font-medium px-1" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
