import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Plus, Flame, Users, Image, MoreVertical } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DashboardMemorialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all user's memorials with stats
  const { data: memorials } = await supabase
    .from("memorials")
    .select(`
      *,
      posts(count),
      candles(count),
      media(count),
      memorial_members(count)
    `)
    .or(`created_by.eq.${user.id}`)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">
            Mes mémoriaux
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos espaces de mémoire et d&apos;hommage
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/app/memorials/new">
            <Plus className="h-4 w-4" />
            Créer un mémorial
          </Link>
        </Button>
      </div>

      {/* Memorials Grid */}
      {memorials && memorials.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memorials.map((memorial) => (
            <Card 
              key={memorial.id} 
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50"
            >
              {/* Cover Image */}
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                {memorial.cover_image_url && (
                  <img 
                    src={memorial.cover_image_url} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Avatar overlay */}
                <Avatar className="absolute -bottom-6 left-4 h-16 w-16 border-4 border-card shadow-lg">
                  <AvatarImage src={memorial.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {memorial.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <CardContent className="pt-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/app/memorials/${memorial.id}`}
                      className="font-semibold text-lg hover:text-primary transition-colors block truncate"
                    >
                      {memorial.full_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {memorial.date_of_birth && memorial.date_of_death
                        ? `${new Date(memorial.date_of_birth).getFullYear()} - ${new Date(memorial.date_of_death).getFullYear()}`
                        : memorial.memorial_type === 'pet' ? 'Compagnon à poils' : 'Dates non renseignées'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{memorial.candles?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Image className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{memorial.media?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{memorial.memorial_members?.[0]?.count || 0}</span>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    memorial.is_public 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {memorial.is_public ? 'Public' : 'Privé'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Aucun mémorial</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Créez un espace de mémoire pour honorer et célébrer la vie de vos proches.
          </p>
          <Button asChild>
            <Link href="/app/memorials/new">
              <Plus className="h-4 w-4 mr-2" />
              Créer mon premier mémorial
            </Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
