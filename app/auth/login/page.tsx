'use client'

import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Scale, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/legal')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.78 0.20 200 / 0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 260 / 0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm space-y-8 z-10">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl glass-cyan flex items-center justify-center">
              <Scale className="w-6 h-6 text-cyan-300" />
            </div>
            <div className="absolute inset-0 w-14 h-14 rounded-2xl blur-xl opacity-40"
              style={{ background: 'oklch(0.78 0.20 200 / 0.5)' }} />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-cyan-400/60" />
              <span className="text-xs font-mono tracking-[0.2em] text-cyan-400/60 uppercase">LexDraft</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Connexion</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Accédez à votre espace juridique</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
                Adresse e-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-sm"
                placeholder="vous@exemple.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-cyan-400 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg glass-amber px-3 py-2.5 text-sm text-amber-300 font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200',
                'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900',
                'hover:from-cyan-400 hover:to-cyan-300 hover:shadow-[0_0_24px_oklch(0.78_0.20_200/0.35)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Connexion…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="h-px bg-white/5" />

          <p className="text-center text-xs text-muted-foreground/50">
            Pas encore de compte ?{' '}
            <Link href="/auth/sign-up" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/30">
          <Link href="/legal" className="hover:text-muted-foreground/60 transition-colors">
            ← Retour à LexDraft
          </Link>
        </p>
      </div>
    </main>
  )
}
