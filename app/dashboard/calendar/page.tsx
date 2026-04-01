'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Plus, Heart, Cake, Star } from "lucide-react"

export default function CalendarPage() {
  // Mock events
  const upcomingEvents = [
    {
      id: '1',
      title: 'Anniversaire de naissance',
      date: '15 Avril 2026',
      type: 'birthday',
      memorial: 'Jean Dupont'
    },
    {
      id: '2',
      title: 'Date de commémoration',
      date: '22 Avril 2026',
      type: 'memorial',
      memorial: 'Marie Martin'
    },
    {
      id: '3',
      title: 'Fête des mères',
      date: '25 Mai 2026',
      type: 'holiday',
      memorial: null
    }
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <Cake className="h-5 w-5 text-pink-500" />
      case 'memorial':
        return <Heart className="h-5 w-5 text-primary" />
      default:
        return <Star className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground mt-1">Dates importantes et rappels</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date}
                    {event.memorial && ` - ${event.memorial}`}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calendar placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avril 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Calendrier interactif</p>
              <p className="text-sm">Bientôt disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
