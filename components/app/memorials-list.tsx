"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Flame, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Memorial {
  id: string
  full_name: string
  date_of_birth: string | null
  date_of_death: string | null
  avatar_url: string | null
  cover_image_url: string | null
  memorial_type: string
  is_public: boolean
  created_by: string
  memorial_members: { count: number }[]
  posts: { count: number }[]
  candles: { count: number }[]
}

interface MemorialsListProps {
  memorials: Memorial[]
  userId: string
}

export function MemorialsList({ memorials, userId }: MemorialsListProps) {
  if (memorials.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucun memorial</h3>
        <p className="text-muted-foreground text-sm">
          Creez votre premier memorial pour honorer un proche
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {memorials.map((memorial) => (
        <Link key={memorial.id} href={`/app/memorials/${memorial.id}`}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            {memorial.cover_image_url && (
              <div 
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: `url(${memorial.cover_image_url})` }}
              />
            )}
            <CardContent className={`p-4 ${memorial.cover_image_url ? '-mt-8' : ''}`}>
              <div className="flex items-start gap-4">
                <Avatar className={`h-16 w-16 border-4 border-background ${memorial.cover_image_url ? 'ring-2 ring-background' : ''}`}>
                  <AvatarImage src={memorial.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {memorial.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{memorial.full_name}</h3>
                    {memorial.created_by === userId && (
                      <Badge variant="secondary" className="text-xs">Votre memorial</Badge>
                    )}
                  </div>
                  
                  {(memorial.date_of_birth || memorial.date_of_death) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <Calendar className="h-3 w-3" />
                      {memorial.date_of_birth && format(new Date(memorial.date_of_birth), "d MMM yyyy", { locale: fr })}
                      {memorial.date_of_birth && memorial.date_of_death && " - "}
                      {memorial.date_of_death && format(new Date(memorial.date_of_death), "d MMM yyyy", { locale: fr })}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {memorial.memorial_members?.[0]?.count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {memorial.posts?.[0]?.count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {memorial.candles?.[0]?.count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
