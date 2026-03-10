import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Une erreur est survenue</h1>
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
    </main>
  )
}
