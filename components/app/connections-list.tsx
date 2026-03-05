'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
}

interface Connection {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  relation_type: string
  requester: UserProfile | null
  addressee: UserProfile | null
}

interface PendingRequest {
  id: string
  requester: UserProfile | null
}

export function ConnectionsList({
  userId,
  connections,
  pendingRequests,
  allUsers,
}: {
  userId: string
  connections: Connection[]
  pendingRequests: PendingRequest[]
  allUsers: UserProfile[]
}) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'connections' | 'find'>('connections')
  const router = useRouter()

  // Get the "other" person in each connection
  const friends = connections.map((c) => {
    const friend = c.requester_id === userId ? c.addressee : c.requester
    return { ...friend, connectionId: c.id }
  })

  // Filter users not already connected
  const connectedIds = new Set(friends.map(f => f?.id).filter(Boolean))
  const pendingIds = new Set(pendingRequests.map(p => p.requester?.id).filter(Boolean))
  const availableUsers = allUsers.filter(u => !connectedIds.has(u.id) && !pendingIds.has(u.id))
  const filteredUsers = search
    ? availableUsers.filter(u => u.display_name?.toLowerCase().includes(search.toLowerCase()))
    : availableUsers

  const handleSendRequest = async (addresseeId: string) => {
    const supabase = createClient()
    await supabase.from('connections').insert({
      requester_id: userId,
      addressee_id: addresseeId,
    })
    router.refresh()
  }

  const handleAccept = async (connectionId: string) => {
    const supabase = createClient()
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId)
    router.refresh()
  }

  const handleDecline = async (connectionId: string) => {
    const supabase = createClient()
    await supabase.from('connections').update({ status: 'declined' }).eq('id', connectionId)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1">
        <button
          onClick={() => setTab('connections')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === 'connections' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Mes connexions ({friends.length})
        </button>
        <button
          onClick={() => setTab('find')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === 'find' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Trouver
        </button>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && tab === 'connections' && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Demandes en attente ({pendingRequests.length})
          </h3>
          {pendingRequests.map((req) => (
            <div key={req.id} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">
                  {req.requester?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{req.requester?.display_name || 'Utilisateur'}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 px-3 text-xs" onClick={() => handleAccept(req.id)}>Accepter</Button>
                <Button size="sm" variant="ghost" className="h-8 px-3 text-xs" onClick={() => handleDecline(req.id)}>Refuser</Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'connections' ? (
        <section className="flex flex-col gap-2">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">{"Vous n'avez pas encore de connexions."}</p>
              <Button size="sm" variant="outline" onClick={() => setTab('find')}>Trouver des personnes</Button>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend?.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {friend?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{friend?.display_name || 'Utilisateur'}</p>
                  {friend?.city && <p className="text-xs text-muted-foreground">{friend.city}</p>}
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <Input
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11"
          />
          <div className="flex flex-col gap-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur trouve.</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.display_name || 'Utilisateur'}</p>
                    {user.city && <p className="text-xs text-muted-foreground">{user.city}</p>}
                  </div>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => handleSendRequest(user.id)}>
                    Ajouter
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}
