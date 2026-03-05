import Link from 'next/link'

export function AppHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3">
      <Link href="/app" className="text-lg font-semibold tracking-tight text-foreground">
        {title || 'Milele'}
      </Link>
      <Link href="/app/connections" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" x2="19" y1="8" y2="14" />
          <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
        <span className="sr-only">Connexions</span>
      </Link>
    </header>
  )
}
