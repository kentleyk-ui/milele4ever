import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inscription reussie</h1>
            <p className="text-sm text-muted-foreground leading-relaxed text-balance">
              Merci de rejoindre Milele. Veuillez verifier votre boite e-mail pour confirmer votre compte avant de vous connecter.
            </p>
          </div>
          <Button asChild className="w-full h-11">
            <Link href="/auth/login">Retour a la connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
