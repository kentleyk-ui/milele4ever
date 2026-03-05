import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app/app-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function MemorialsPage() {
  const supabase = await createClient()

  const { data: memorials } = await supabase
    .from('memorials')
    .select('*, profiles:created_by(display_name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  return (
    <>
      <AppHeader title="Memoriaux" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{memorials?.length || 0} memorial{(memorials?.length || 0) !== 1 ? 'ux' : ''}</p>
          <Button asChild size="sm" className="h-8">
            <Link href="/app/memorials/new">Creer un memorial</Link>
          </Button>
        </div>

        {(!memorials || memorials.length === 0) ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-10 0c0-1.5.5-2 1-3 .5 1.5 1.5 2 2 2a3 3 0 0 0 2-7z" />
                <path d="M12 15v7" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Aucun memorial pour le moment</p>
              <p className="text-xs text-muted-foreground">{"Creez le premier memorial pour honorer la memoire d'un etre cher."}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {memorials.map((memorial) => (
              <Link
                key={memorial.id}
                href={`/app/memorials/${memorial.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-primary/10">
                  {memorial.photo_url ? (
                    <img src={memorial.photo_url} alt={memorial.name} className="h-full w-full object-cover" />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                      <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-10 0c0-1.5.5-2 1-3 .5 1.5 1.5 2 2 2a3 3 0 0 0 2-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{memorial.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {memorial.type === 'human' ? 'Humain' : 'Animal'}
                    {memorial.species ? ` - ${memorial.species}` : ''}
                  </p>
                  {memorial.death_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(memorial.death_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Par {memorial.profiles?.display_name || 'Utilisateur'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
