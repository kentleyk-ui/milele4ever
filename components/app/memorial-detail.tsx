"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app/app-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Flame, 
  Image as ImageIcon, 
  Clock, 
  Users, 
  MessageSquare,
  Calendar,
  MapPin,
  Edit,
  Share2
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { LightCandleDialog } from "./light-candle-dialog"
import { CreatePostDialog } from "./create-post-dialog"
import Link from "next/link"

interface MemorialDetailProps {
  memorial: {
    id: string
    full_name: string
    date_of_birth: string | null
    date_of_death: string | null
    place_of_birth: string | null
    place_of_death: string | null
    biography: string | null
    avatar_url: string | null
    cover_image_url: string | null
    memorial_type: string
    is_public: boolean
    created_by: string
    profiles: { full_name: string; avatar_url: string | null } | null
    memorial_members: Array<{
      id: string
      role: string
      relationship: string
      user_id: string
      profiles: { full_name: string; avatar_url: string | null }
    }>
    posts: Array<{
      id: string
      content: string
      post_type: string
      created_at: string
      profiles: { full_name: string; avatar_url: string | null }
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
      event_date: string | null
      event_type: string
    }>
    media: Array<{
      id: string
      url: string
      media_type: string
      caption: string | null
      taken_at: string | null
    }>
  }
  currentUserId: string
  isMember: boolean
  userRole: string
}

export function MemorialDetail({ memorial, currentUserId, isMember, userRole }: MemorialDetailProps) {
  const [showCandleDialog, setShowCandleDialog] = useState(false)
  const [showPostDialog, setShowPostDialog] = useState(false)

  const canEdit = userRole === "owner" || userRole === "editor"

  const calculateAge = () => {
    if (!memorial.date_of_birth) return null
    const birth = new Date(memorial.date_of_birth)
    const death = memorial.date_of_death ? new Date(memorial.date_of_death) : new Date()
    const age = death.getFullYear() - birth.getFullYear()
    return age
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        title={memorial.full_name} 
        showBack 
        actions={
          canEdit ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/app/memorials/${memorial.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Cover & Avatar */}
      <div className="relative">
        <div 
          className="h-48 bg-gradient-to-b from-primary/20 to-background bg-cover bg-center"
          style={memorial.cover_image_url ? { backgroundImage: `url(${memorial.cover_image_url})` } : undefined}
        />
        <div className="absolute -bottom-16 left-4">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={memorial.avatar_url || undefined} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {memorial.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <main className="flex-1 px-4 pt-20 pb-24">
        {/* Info Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{memorial.full_name}</h1>
          
          {(memorial.date_of_birth || memorial.date_of_death) && (
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {memorial.date_of_birth && format(new Date(memorial.date_of_birth), "d MMMM yyyy", { locale: fr })}
              {memorial.date_of_birth && memorial.date_of_death && " - "}
              {memorial.date_of_death && format(new Date(memorial.date_of_death), "d MMMM yyyy", { locale: fr })}
              {calculateAge() && ` (${calculateAge()} ans)`}
            </p>
          )}

          {(memorial.place_of_birth || memorial.place_of_death) && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3" />
              {memorial.place_of_birth}
              {memorial.place_of_birth && memorial.place_of_death && " - "}
              {memorial.place_of_death}
            </p>
          )}

          {/* Quick Stats */}
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{memorial.candles?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bougies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{memorial.posts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Souvenirs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{memorial.media?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Photos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{memorial.memorial_members?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Membres</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button onClick={() => setShowCandleDialog(true)} variant="outline" className="flex-1">
              <Flame className="h-4 w-4 mr-2" />
              Allumer une bougie
            </Button>
            <Button onClick={() => setShowPostDialog(true)} className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Partager un souvenir
            </Button>
          </div>
        </div>

        {/* Biography */}
        {memorial.biography && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm whitespace-pre-wrap">{memorial.biography}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="souvenirs" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="souvenirs">
              <MessageSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="galerie">
              <ImageIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="famille">
              <Users className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="souvenirs" className="mt-4 space-y-4">
            {memorial.posts?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun souvenir partage pour le moment
              </p>
            ) : (
              memorial.posts?.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {post.profiles?.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{post.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {post.post_type === "memory" && "Souvenir"}
                        {post.post_type === "tribute" && "Hommage"}
                        {post.post_type === "candle" && "Bougie"}
                      </Badge>
                    </div>
                    <p className="text-sm">{post.content}</p>
                    {post.media?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {post.media.map((m) => (
                          <img
                            key={m.id}
                            src={m.url}
                            alt={m.caption || ""}
                            className="rounded-lg object-cover aspect-square"
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="galerie" className="mt-4">
            {memorial.media?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune photo pour le moment
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {memorial.media?.map((m) => (
                  <Link key={m.id} href={`/app/memorials/${memorial.id}/gallery/${m.id}`}>
                    <img
                      src={m.url}
                      alt={m.caption || ""}
                      className="rounded-lg object-cover aspect-square w-full"
                    />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {memorial.timeline_events?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Aucun evenement dans la timeline</p>
                {canEdit && (
                  <Button variant="outline" asChild>
                    <Link href={`/app/memorials/${memorial.id}/timeline`}>
                      Ajouter un evenement
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {memorial.timeline_events?.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      {event.event_date && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "d MMMM yyyy", { locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="famille" className="mt-4">
            <div className="space-y-3">
              {memorial.memorial_members?.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.relationship}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <LightCandleDialog 
        open={showCandleDialog} 
        onOpenChange={setShowCandleDialog}
        memorialId={memorial.id}
        userId={currentUserId}
      />

      <CreatePostDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        memorialId={memorial.id}
        userId={currentUserId}
      />
    </div>
  )
}
