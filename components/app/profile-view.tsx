'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  city: string | null
  country: string | null
}

interface Memorial {
  id: string
  name: string
  type: string
  photo_url: string | null
  death_date: string | null
}

export function ProfileView({
  profile,
  email,
  memorials,
  connectionsCount,
}: {
  profile: Profile | null
  email: string
  memorials: Memorial[]
  connectionsCount: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    country: profile?.country || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      ...form,
      updated_at: new Date().toISOString(),
    }).eq('id', profile?.id)
    setIsEditing(false)
    setIsLoading(false)
    router.refresh()
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-primary/5 px-4 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-3 border-card overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-muted-foreground">
                {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">{profile?.display_name || 'Utilisateur'}</h1>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-4 mt-2">
              <Link href="/app/connections" className="text-sm text-primary">
                <span className="font-semibold">{connectionsCount}</span> connexion{connectionsCount !== 1 ? 's' : ''}
              </Link>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold">{memorials.length}</span> memorial{memorials.length !== 1 ? 'ux' : ''}
              </span>
            </div>
          </div>
        </div>
        {profile?.bio && <p className="mt-4 text-sm text-foreground leading-relaxed">{profile.bio}</p>}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-9"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isLoading}
          >
            {isEditing ? (isLoading ? 'Sauvegarde...' : 'Sauvegarder') : 'Modifier le profil'}
          </Button>
          {isEditing && (
            <Button variant="ghost" size="sm" className="h-9" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
          )}
        </div>

        {/* Edit form */}
        {isEditing && (
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="first_name" className="text-xs">Prenom</Label>
                <Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name" className="text-xs">Nom</Label>
                <Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-10" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_name" className="text-xs">Nom affiche</Label>
              <Input id="display_name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-xs">Biographie</Label>
              <textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="city" className="text-xs">Ville</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country" className="text-xs">Pays</Label>
                <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="h-10" />
              </div>
            </div>
          </div>
        )}

        {/* My Memorials */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mes memoriaux</h2>
            <Link href="/app/memorials/new" className="text-xs text-primary hover:underline">Creer</Link>
          </div>
          {memorials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{"Vous n'avez pas encore cree de memorial."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {memorials.map((m) => (
                <Link
                  key={m.id}
                  href={`/app/memorials/${m.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                        <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-10 0c0-1.5.5-2 1-3 .5 1.5 1.5 2 2 2a3 3 0 0 0 2-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.type === 'human' ? 'Humain' : 'Animal'}
                      {m.death_date ? ` - ${new Date(m.death_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Logout */}
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive mt-4" onClick={handleLogout}>
          Se deconnecter
        </Button>
      </div>
    </div>
  )
}
