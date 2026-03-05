'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppHeader } from '@/components/app/app-header'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function NewMemorialPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    type: 'human' as 'human' | 'animal',
    species: '',
    birth_date: '',
    death_date: '',
    biography: '',
    city: '',
    country: '',
    is_public: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: err } = await supabase.from('memorials').insert({
      created_by: userId,
      name: form.name,
      type: form.type,
      species: form.type === 'animal' ? form.species : null,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
      biography: form.biography || null,
      city: form.city || null,
      country: form.country || null,
      is_public: form.is_public,
    }).select('id').single()

    if (err) {
      setError(err.message)
      setIsLoading(false)
      return
    }

    router.push(`/app/memorials/${data.id}`)
  }

  return (
    <>
      <AppHeader title="Nouveau memorial" />
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'human' })}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                form.type === 'human' ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={form.type === 'human' ? 'text-primary' : 'text-muted-foreground'}>
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              <span className={`text-sm font-medium ${form.type === 'human' ? 'text-primary' : 'text-muted-foreground'}`}>Humain</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'animal' })}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                form.type === 'animal' ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={form.type === 'animal' ? 'text-primary' : 'text-muted-foreground'}>
                <circle cx="11" cy="4" r="2" />
                <circle cx="18" cy="8" r="2" />
                <circle cx="20" cy="16" r="2" />
                <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
              </svg>
              <span className={`text-sm font-medium ${form.type === 'animal' ? 'text-primary' : 'text-muted-foreground'}`}>Animal</span>
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" placeholder={form.type === 'human' ? 'Prenom et nom' : "Nom de l'animal"} />
            </div>

            {form.type === 'animal' && (
              <div className="grid gap-2">
                <Label htmlFor="species">Espece</Label>
                <Input id="species" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="h-11" placeholder="Chien, chat, cheval..." />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input id="birth_date" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="h-11" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="death_date">Date de deces</Label>
                <Input id="death_date" type="date" value={form.death_date} onChange={(e) => setForm({ ...form, death_date: e.target.value })} className="h-11" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="biography">Biographie / Hommage</Label>
              <textarea
                id="biography"
                rows={4}
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
                placeholder="Partagez des souvenirs, une description de cette personne..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Pays</Label>
                <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="h-11" />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm text-foreground">Memorial public (visible par tous)</span>
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-11 w-full" disabled={isLoading || !userId}>
            {isLoading ? 'Creation...' : 'Creer le memorial'}
          </Button>
        </form>
      </div>
    </>
  )
}
