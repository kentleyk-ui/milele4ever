import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md md:px-12">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <svg
            width="18"
            height="18"
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
        <span className="text-xl font-bold text-foreground">Milele</span>
      </Link>
      <nav className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">Connexion</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Inscription</Link>
        </Button>
      </nav>
    </header>
  )
}
