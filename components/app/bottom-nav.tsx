'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { parseHtmlInText } from '@/lib/i18n/parse-html'

function MalaikaIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary)' : 'currentColor'
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Aile gauche */}
      <path
        d="M4 12 C2 9, 2 5, 5 4 C8 3, 11 6, 11 10"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M3 15 C1 12, 1.5 7, 5 6 C7 5.5, 9.5 7, 10 10"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* Aile droite */}
      <path
        d="M22 12 C24 9, 24 5, 21 4 C18 3, 15 6, 15 10"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M23 15 C25 12, 24.5 7, 21 6 C19 5.5, 16.5 7, 16 10"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* Auréole */}
      <ellipse
        cx="13"
        cy="6.5"
        rx="4.5"
        ry="1.5"
        stroke={active ? '#fbbf24' : color}
        strokeWidth="1.2"
        fill="none"
        opacity={active ? '0.9' : '0.5'}
      />
      {/* Tête */}
      <circle cx="13" cy="12" r="3.5" stroke={color} strokeWidth="1.3" fill="none" />
      {/* Corps / robe */}
      <path
        d="M10 15.5 C9 18, 8.5 21, 9 23 L13 24 L17 23 C17.5 21, 17 18, 16 15.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Mains */}
      <path d="M10 18 C8.5 17.5, 7.5 18.5, 8 19.5" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M16 18 C17.5 17.5, 18.5 18.5, 18 19.5" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
    {
      href: '/app',
      label: t('app.feed'),
      icon: (active: boolean) => (
        <svg className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: '/app/memorials',
      label: t('app.memorials'),
      labelWithHtml: parseHtmlInText(t('app.memorials')),
      icon: (active: boolean) => (
        <svg className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      ),
    },
    {
      href: '/app/services',
      label: t('app.services'),
      icon: (active: boolean) => (
        <svg className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
    },
    {
      href: '/app/messages',
      label: t('app.messages'),
      icon: (active: boolean) => (
        <svg className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      ),
    },
    {
      href: '/app/notifications',
      label: t('app.notifications'),
      icon: (active: boolean) => (
        <svg className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      ),
    },
    {
      href: '/malaika',
      label: 'Malaika',
      icon: (active: boolean) => <MalaikaIcon active={active} />,
    },
    {
      href: '/legal',
      label: t('legal.title'),
      icon: (active: boolean) => (
        <svg className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.59 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.icon(isActive)}
              <span className="text-[10px] font-medium">{item.labelWithHtml || item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
