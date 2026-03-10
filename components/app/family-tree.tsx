"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import Link from "next/link"

interface Memorial {
  id: string
  full_name: string
  avatar_url: string | null
  date_of_birth: string | null
  date_of_death: string | null
}

interface Relationship {
  id: string
  relationship_type: string
  related_memorial: Memorial | null
}

interface FamilyTreeProps {
  centralPerson: Memorial
  relationships: Relationship[]
  canEdit: boolean
}

const relationshipLabels: Record<string, string> = {
  parent: "Parent",
  child: "Enfant",
  spouse: "Conjoint(e)",
  sibling: "Frere/Soeur",
  grandparent: "Grand-parent",
  grandchild: "Petit-enfant",
  aunt_uncle: "Oncle/Tante",
  niece_nephew: "Neveu/Niece",
  cousin: "Cousin(e)",
}

const relationshipGroups = [
  { type: "parent", label: "Parents" },
  { type: "spouse", label: "Conjoint(e)s" },
  { type: "sibling", label: "Freres et Soeurs" },
  { type: "child", label: "Enfants" },
  { type: "grandparent", label: "Grands-parents" },
  { type: "grandchild", label: "Petits-enfants" },
  { type: "aunt_uncle", label: "Oncles et Tantes" },
  { type: "niece_nephew", label: "Neveux et Nieces" },
  { type: "cousin", label: "Cousins" },
]

export function FamilyTree({ centralPerson, relationships, canEdit }: FamilyTreeProps) {
  // Group relationships by type
  const groupedRelationships = relationshipGroups.map(group => ({
    ...group,
    members: relationships.filter(r => r.relationship_type === group.type && r.related_memorial)
  })).filter(group => group.members.length > 0)

  if (relationships.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucun lien familial</h3>
        <p className="text-muted-foreground text-sm">
          Ajoutez des membres de la famille pour construire l&apos;arbre genealogique
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Central person */}
      <div className="flex justify-center mb-8">
        <Card className="border-primary border-2">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={centralPerson.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {centralPerson.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-lg">{centralPerson.full_name}</h2>
              <Badge variant="secondary">Personne principale</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relationship groups */}
      {groupedRelationships.map(group => (
        <div key={group.type}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {group.label}
          </h3>
          <div className="grid gap-3">
            {group.members.map(relationship => (
              <Link 
                key={relationship.id} 
                href={`/app/memorials/${relationship.related_memorial?.id}`}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={relationship.related_memorial?.avatar_url || undefined} />
                      <AvatarFallback>
                        {relationship.related_memorial?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{relationship.related_memorial?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {relationshipLabels[relationship.relationship_type]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
