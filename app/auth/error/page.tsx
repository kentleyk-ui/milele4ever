import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" x2="9" y1="9" y2="15" />
              <line x1="9" x2="15" y1="9" y2="15" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Une erreur est survenue</h1>
            {params?.error ? (
              <p className="text-sm text-muted-foreground">Code erreur : {params.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Une erreur non specifiee est survenue.</p>
            )}
          </div>
          <Button asChild className="w-full h-11">
            <Link href="/auth/login">Retour a la connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
