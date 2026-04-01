'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Heart, 
  Flame, 
  Image as ImageIcon, 
  Calendar, 
  Users, 
  MessageSquare,
  Share2,
  ArrowLeft,
  MapPin,
  BookOpen
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Memorial {
  id: string
  full_name: string
  date_of_birth: string | null
  date_of_death: string | null
  place_of_birth: string | null
  place_of_death: string | null
  biography: string | null
  cover_image_url: string | null
  avatar_url: string | null
  memorial_type: 'human' | 'pet'
  posts: Array<{
    id: string
    content: string
    post_type: string
    created_at: string
    profiles: { full_name: string; avatar_url: string | null } | null
    media: Array<{ id: string; url: string; media_type: string; caption: string | null }>
  }>
  candles: Array<{
    id: string
    message: string | null
    created_at: string
    profiles: { full_name: string } | null
  }>
  timeline_events: Array<{
    id: string
    title: string
    description: string | null
    event_date: string
    event_type: string
    location: string | null
  }>
  media: Array<{
    id: string
    url: string
    media_type: string
    caption: string | null
    taken_at: string | null
  }>
}

interface PublicMemorialViewProps {
  memorial: Memorial
  currentUserId: string | null
}

export function PublicMemorialView({ memorial, currentUserId }: PublicMemorialViewProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState("biography")

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateAge = () => {
    if (!memorial.date_of_birth || !memorial.date_of_death) return null
    const birth = new Date(memorial.date_of_birth)
    const death = new Date(memorial.date_of_death)
    const age = death.getFullYear() - birth.getFullYear()
    return age
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <Link href="/" className="font-serif font-bold text-lg">Milele</Link>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-14">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5">
          {memorial.cover_image_url && (
            <img 
              src={memorial.cover_image_url} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={memorial.avatar_url || ""} />
              <AvatarFallback className="bg-primary/20 text-primary text-4xl font-serif">
                {memorial.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-4">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                {memorial.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                {memorial.date_of_birth && memorial.date_of_death && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(memorial.date_of_birth).getFullYear()} - {new Date(memorial.date_of_death).getFullYear()}
                    {calculateAge() && ` (${calculateAge()} ans)`}
                  </span>
                )}
                {memorial.place_of_death && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {memorial.place_of_death}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pb-4">
              <Button className="gap-2">
                <Flame className="h-4 w-4" />
                Allumer une bougie
              </Button>
              {!currentUserId && (
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/50 bg-muted/30 mt-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{memorial.candles?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Bougies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{memorial.posts?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Hommages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{memorial.media?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Photos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 mb-8">
            <TabsTrigger value="biography" className="gap-2">
              <BookOpen className="h-4 w-4 hidden sm:block" />
              Biographie
            </TabsTrigger>
            <TabsTrigger value="tributes" className="gap-2">
              <MessageSquare className="h-4 w-4 hidden sm:block" />
              Hommages
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="h-4 w-4 hidden sm:block" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4 hidden sm:block" />
              Vie
            </TabsTrigger>
          </TabsList>

          <div className="max-w-3xl mx-auto">
            {/* Biography Tab */}
            <TabsContent value="biography" className="space-y-6">
              {memorial.biography ? (
                <Card className="border-border/50">
                  <CardContent className="p-6 md:p-8">
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                      {memorial.biography}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 p-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune biographie pour le moment</p>
                </Card>
              )}

              {/* Key Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                {memorial.date_of_birth && (
                  <Card className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <span className="text-2xl">🌱</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Naissance</p>
                        <p className="font-medium">{formatDate(memorial.date_of_birth)}</p>
                        {memorial.place_of_birth && (
                          <p className="text-sm text-muted-foreground">{memorial.place_of_birth}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {memorial.date_of_death && (
                  <Card className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl">🕊️</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Décès</p>
                        <p className="font-medium">{formatDate(memorial.date_of_death)}</p>
                        {memorial.place_of_death && (
                          <p className="text-sm text-muted-foreground">{memorial.place_of_death}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tributes Tab */}
            <TabsContent value="tributes" className="space-y-4">
              {memorial.posts && memorial.posts.length > 0 ? (
                memorial.posts.map((post) => (
                  <Card key={post.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.profiles?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {post.profiles?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{post.profiles?.full_name || "Anonyme"}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{post.content}</p>
                          {post.media && post.media.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {post.media.map((m) => (
                                <img 
                                  key={m.id} 
                                  src={m.url} 
                                  alt={m.caption || ""} 
                                  className="rounded-lg w-full h-32 object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-border/50 p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun hommage pour le moment</p>
                  {currentUserId && (
                    <Button>Écrire un hommage</Button>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery">
              {memorial.media && memorial.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {memorial.media.map((m) => (
                    <Card key={m.id} className="overflow-hidden border-border/50 group cursor-pointer">
                      <div className="aspect-square relative">
                        <img 
                          src={m.url} 
                          alt={m.caption || ""} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {m.caption && (
                        <CardContent className="p-3">
                          <p className="text-sm text-muted-foreground truncate">{m.caption}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50 p-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune photo pour le moment</p>
                </Card>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              {memorial.timeline_events && memorial.timeline_events.length > 0 ? (
                <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
                  {memorial.timeline_events.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[41px] h-4 w-4 rounded-full bg-primary border-4 border-background" />
                      <Card className="border-border/50">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">
                            {formatDate(event.event_date)}
                          </p>
                          <h3 className="font-semibold mb-1">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50 p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun événement de vie pour le moment</p>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </section>

      {/* Candles Section */}
      {memorial.candles && memorial.candles.length > 0 && (
        <section className="bg-gradient-to-b from-orange-500/5 to-transparent py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              Bougies allumées
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {memorial.candles.slice(0, 12).map((candle) => (
                <Card key={candle.id} className="border-border/50 text-center p-4">
                  <div className="text-3xl mb-2">🕯️</div>
                  <p className="text-sm font-medium truncate">
                    {candle.profiles?.full_name || "Anonyme"}
                  </p>
                  {candle.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {candle.message}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-serif text-xl font-bold mb-4">
            Créez votre propre espace de mémoire
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Milele vous permet d&apos;honorer et de célébrer la vie de vos proches pour l&apos;éternité.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Créer un mémorial</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
