"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Baby, 
  GraduationCap, 
  Briefcase, 
  Heart, 
  Star, 
  Trophy, 
  Plane, 
  Clock,
  MapPin
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface TimelineEvent {
  id: string
  title: string
  description: string | null
  event_date: string | null
  event_type: string
  location: string | null
  media_url: string | null
  created_at: string
  profiles: { full_name: string } | null
}

interface Memorial {
  id: string
  full_name: string
  date_of_birth: string | null
  date_of_death: string | null
}

interface TimelineViewProps {
  events: TimelineEvent[]
  memorial: Memorial
  canEdit: boolean
}

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  birth: { icon: Baby, color: "bg-pink-500", label: "Naissance" },
  education: { icon: GraduationCap, color: "bg-blue-500", label: "Education" },
  career: { icon: Briefcase, color: "bg-amber-500", label: "Carriere" },
  marriage: { icon: Heart, color: "bg-red-500", label: "Mariage" },
  milestone: { icon: Star, color: "bg-purple-500", label: "Etape" },
  achievement: { icon: Trophy, color: "bg-yellow-500", label: "Accomplissement" },
  travel: { icon: Plane, color: "bg-cyan-500", label: "Voyage" },
  other: { icon: Clock, color: "bg-gray-500", label: "Autre" },
}

export function TimelineView({ events, memorial, canEdit }: TimelineViewProps) {
  // Build complete timeline with birth and death
  const fullTimeline: TimelineEvent[] = []
  
  if (memorial.date_of_birth) {
    fullTimeline.push({
      id: "birth",
      title: "Naissance",
      description: `Naissance de ${memorial.full_name}`,
      event_date: memorial.date_of_birth,
      event_type: "birth",
      location: null,
      media_url: null,
      created_at: "",
      profiles: null,
    })
  }

  fullTimeline.push(...events)

  if (memorial.date_of_death) {
    fullTimeline.push({
      id: "death",
      title: "Deces",
      description: null,
      event_date: memorial.date_of_death,
      event_type: "other",
      location: null,
      media_url: null,
      created_at: "",
      profiles: null,
    })
  }

  // Sort by date
  fullTimeline.sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  })

  if (fullTimeline.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucun evenement</h3>
        <p className="text-muted-foreground text-sm">
          Ajoutez des moments importants de la vie
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {fullTimeline.map((event, index) => {
          const config = eventTypeConfig[event.event_type] || eventTypeConfig.other
          const Icon = config.icon

          return (
            <div key={event.id} className="relative pl-12">
              {/* Timeline dot */}
              <div className={`absolute left-2 -translate-x-1/2 w-5 h-5 rounded-full ${config.color} flex items-center justify-center`}>
                <Icon className="h-3 w-3 text-white" />
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.event_date && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "d MMMM yyyy", { locale: fr })}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.description}
                    </p>
                  )}

                  {event.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}

                  {event.media_url && (
                    <img
                      src={`/api/file?pathname=${encodeURIComponent(event.media_url)}`}
                      alt={event.title}
                      className="mt-3 rounded-lg w-full max-h-48 object-cover"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
