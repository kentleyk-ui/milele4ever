"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Loader2 } from "lucide-react"

interface Memorial {
  id: string
  full_name: string
  avatar_url: string | null
}

interface AddFamilyMemberButtonProps {
  memorialId: string
  availableMemorials: Memorial[]
  existingRelationships: string[]
}

const relationshipTypes = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Enfant" },
  { value: "spouse", label: "Conjoint(e)" },
  { value: "sibling", label: "Frere/Soeur" },
  { value: "grandparent", label: "Grand-parent" },
  { value: "grandchild", label: "Petit-enfant" },
  { value: "aunt_uncle", label: "Oncle/Tante" },
  { value: "niece_nephew", label: "Neveu/Niece" },
  { value: "cousin", label: "Cousin(e)" },
]

export function AddFamilyMemberButton({ memorialId, availableMemorials, existingRelationships }: AddFamilyMemberButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [selectedMemorial, setSelectedMemorial] = useState("")
  const [relationshipType, setRelationshipType] = useState("")

  // Filter out already related memorials
  const filteredMemorials = availableMemorials.filter(
    m => !existingRelationships.includes(m.id)
  )

  const handleSubmit = async () => {
    if (!selectedMemorial || !relationshipType) return

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Add relationship
      await supabase.from("family_relationships").insert({
        memorial_id: memorialId,
        related_memorial_id: selectedMemorial,
        relationship_type: relationshipType,
        created_by: user.id,
      })

      // Add inverse relationship
      const inverseType = getInverseRelationship(relationshipType)
      if (inverseType) {
        await supabase.from("family_relationships").insert({
          memorial_id: selectedMemorial,
          related_memorial_id: memorialId,
          relationship_type: inverseType,
          created_by: user.id,
        })
      }

      setSelectedMemorial("")
      setRelationshipType("")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding family member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un lien familial</DialogTitle>
          <DialogDescription>
            Liez un memorial existant en tant que membre de la famille
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Memorial a lier</Label>
            <Select value={selectedMemorial} onValueChange={setSelectedMemorial}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selectionner un memorial" />
              </SelectTrigger>
              <SelectContent>
                {filteredMemorials.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Aucun memorial disponible
                  </div>
                ) : (
                  filteredMemorials.map((memorial) => (
                    <SelectItem key={memorial.id} value={memorial.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={memorial.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {memorial.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {memorial.full_name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type de relation</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selectionner la relation" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedMemorial || !relationshipType || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getInverseRelationship(type: string): string | null {
  const inverses: Record<string, string> = {
    parent: "child",
    child: "parent",
    spouse: "spouse",
    sibling: "sibling",
    grandparent: "grandchild",
    grandchild: "grandparent",
    aunt_uncle: "niece_nephew",
    niece_nephew: "aunt_uncle",
    cousin: "cousin",
  }
  return inverses[type] || null
}
