import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="flex flex-col items-center gap-4 border-t border-border/50 px-6 py-8 text-center md:px-12">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
            aria-hidden="true"
          >
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
            <path d="M12 6v12" />
            <path d="M8 8c0 2 1.5 4 4 4s4-2 4-4" />
          </svg>
        </div>
        <span className="text-base font-semibold text-foreground">Milele</span>
      </Link>
      <p className="text-sm text-muted-foreground">
        Pour toujours dans nos coeurs. Avec respect et dignite.
      </p>
      <p className="text-xs text-muted-foreground/60">
        {'© '}{new Date().getFullYear()} Milele. Tous droits reserves.
      </p>
    </footer>
  )
}
