'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Search, Plus } from "lucide-react"

export default function MessagesPage() {
  // Mock conversations - will be replaced with Supabase data
  const conversations = [
    {
      id: '1',
      participant: { name: 'Marie Dupont', avatar: null },
      lastMessage: 'Merci pour vos condoléances...',
      unread: 2,
      timestamp: 'Il y a 2h'
    },
    {
      id: '2',
      participant: { name: 'Jean Martin', avatar: null },
      lastMessage: 'Le service était très touchant.',
      unread: 0,
      timestamp: 'Hier'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Vos conversations privées</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau message
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher une conversation..." 
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.length > 0 ? (
            <div className="divide-y divide-border">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={convo.participant.avatar || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {convo.participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{convo.participant.name}</p>
                      <span className="text-xs text-muted-foreground">{convo.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {convo.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune conversation</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
