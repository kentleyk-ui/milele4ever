import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Inscription reussie</h1>
          <p className="text-sm text-muted-foreground">
            Merci de rejoindre Milele. Veuillez verifier votre boite e-mail pour confirmer votre compte avant de vous connecter.
          </p>
        </div>

        <Button className="w-full h-11">
          <Link href="/auth/login">Retour a la connexion</Link>
        </Button>
      </div>
    </main>
  )
}
