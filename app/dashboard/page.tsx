import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Users, MessageSquare, Calendar, Plus, ArrowRight, Flame, BookOpen } from "lucide-react"
import Link from "next/link"
import { getTranslation, type Language } from "@/lib/i18n/translations"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('language')?.value as Language) || 'fr'
  const t = (key: string) => getTranslation(lang, key)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's memorials
  const { data: memorials } = await supabase
    .from("memorials")
    .select(`
      *,
      posts(count),
      candles(count),
      media(count)
    `)
    .or(`created_by.eq.${user.id},memorial_members.user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch conversation IDs for the user
  const { data: userConversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)

  const conversationIds = userConversations?.map(c => c.conversation_id) || []

  // Fetch unread messages count
  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .in("conversation_id", conversationIds)

  // Fetch upcoming events
  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingEvents } = await supabase
    .from("timeline_events")
    .select("*, memorials(full_name)")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(3)

  // Fetch recent notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5)

  // Stats
  const totalMemorials = memorials?.length || 0
  const totalCandles = memorials?.reduce((sum, m) => sum + (m.candles?.[0]?.count || 0), 0) || 0
  const totalPosts = memorials?.reduce((sum, m) => sum + (m.posts?.[0]?.count || 0), 0) || 0

  const stats = [
    { label: "Mémoriaux", value: totalMemorials, icon: Heart, color: "text-primary" },
    { label: "Bougies allumées", value: totalCandles, icon: Flame, color: "text-orange-500" },
    { label: "Publications", value: totalPosts, icon: BookOpen, color: "text-blue-500" },
    { label: "Messages", value: unreadMessages || 0, icon: MessageSquare, color: "text-purple-500" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue dans votre espace Milele
          </p>
        </div>
        <Button className="gap-2">
          <Link href="/app/memorials/new">
            <Plus className="h-4 w-4" />
            Créer un mémorial
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Memorials */}
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Mes mémoriaux</CardTitle>
              <CardDescription>Vos espaces de mémoire</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Link href="/dashboard/memorials" className="gap-1">
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {memorials && memorials.length > 0 ? (
              memorials.slice(0, 4).map((memorial) => (
                <Link
                  key={memorial.id}
                  href={`/app/memorials/${memorial.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={memorial.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {memorial.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{memorial.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {memorial.date_of_birth && memorial.date_of_death
                        ? `${new Date(memorial.date_of_birth).getFullYear()} - ${new Date(memorial.date_of_death).getFullYear()}`
                        : "Dates non renseignées"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{memorial.candles?.[0]?.count || 0}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Aucun mémorial créé</p>
                <Button size="sm">
                  <Link href="/app/memorials/new">Créer mon premier mémorial</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity & Events */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Activité récente</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Link href="/dashboard/notifications" className="gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Aucune nouvelle notification
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Événements à venir</CardTitle>
                <CardDescription>Anniversaires et dates importantes</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Link href="/dashboard/calendar" className="gap-1">
                  Calendrier <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Aucun événement à venir
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Besoin d&apos;aide ?</h3>
              <p className="text-muted-foreground text-sm">
                Malaika, votre guide spirituel, est là pour vous accompagner dans vos démarches.
              </p>
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Link href="/malaika">
                <span className="text-yellow-300">✦</span>
                Parler à Malaika
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
