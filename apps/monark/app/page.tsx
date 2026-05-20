'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MonarkConsole from '@/components/MonarkConsole'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<{ access_token: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setSigningIn(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setSigningIn(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
    </div>
  )

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-sm rounded-2xl p-8 space-y-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-2xl font-bold">Monark</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Console d'administration</p>
        </div>
        <form onSubmit={signIn} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:border-purple-400"
            style={{ borderColor: 'var(--border)' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:border-purple-400"
            style={{ borderColor: 'var(--border)' }}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={signingIn}
            className="w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            {signingIn ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )

  return <MonarkConsole token={session.access_token} />
}
