'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Calendar } from "lucide-react"

export default function JournalPage() {
  // Mock journal entries
  const entries = [
    {
      id: '1',
      title: 'Souvenirs du jardin',
      excerpt: 'Aujourd\'hui je me suis rappelé de ces moments passés ensemble dans le jardin...',
      date: '28 Mars 2026',
      mood: 'peaceful'
    },
    {
      id: '2',
      title: 'La recette de grand-mère',
      excerpt: 'J\'ai retrouvé le vieux carnet avec sa recette de gâteau au chocolat...',
      date: '25 Mars 2026',
      mood: 'nostalgic'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Journal</h1>
          <p className="text-muted-foreground mt-1">Votre espace personnel d&apos;écriture et de réflexion</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle entrée
        </Button>
      </div>

      <div className="grid gap-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Card key={entry.id} className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      {entry.date}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{entry.title}</h3>
                    <p className="text-muted-foreground line-clamp-2">{entry.excerpt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Commencez votre journal</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Écrivez vos pensées, vos souvenirs et vos réflexions dans un espace privé et sécurisé.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
