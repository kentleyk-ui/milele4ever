import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MemorialsList } from "@/components/app/memorials-list"
import { AppHeader } from "@/components/app/app-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function MemorialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: memorials } = await supabase
    .from("memorials")
    .select(`
      *,
      memorial_members(count),
      posts(count),
      candles(count)
    `)
    .or(`created_by.eq.${user.id},is_public.eq.true`)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="Memoriaux" />
      
      <main className="flex-1 p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Memoriaux</h1>
            <p className="text-muted-foreground text-sm">
              Honorez la memoire de vos proches
            </p>
          </div>
          <Button asChild>
            <Link href="/app/memorials/new">
              <Plus className="h-4 w-4 mr-2" />
              Creer
            </Link>
          </Button>
        </div>

        <MemorialsList memorials={memorials || []} userId={user.id} />
      </main>
    </div>
  )
}
