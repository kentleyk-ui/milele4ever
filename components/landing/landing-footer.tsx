import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="border-t py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
        <Link href="/" className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-primary"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="font-semibold">Milele</span>
        </Link>
        <p className="text-sm text-muted-foreground max-w-md">
          Pour toujours dans nos coeurs. Avec respect et dignite.
        </p>
        <p className="text-xs text-muted-foreground">
          Product Owner - Kent Ley_CIO {'© '}{new Date().getFullYear()} Milele. Tous droits reserves.
        </p>
      </div>
    </footer>
  )
}
