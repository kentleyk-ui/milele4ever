"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { User, PawPrint, Loader2 } from "lucide-react"

interface CreateMemorialFormProps {
  userId: string
}

export function CreateMemorialForm({ userId }: CreateMemorialFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    date_of_death: "",
    place_of_birth: "",
    place_of_death: "",
    biography: "",
    memorial_type: "human",
    is_public: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("memorials")
        .insert({
          ...formData,
          created_by: userId,
          date_of_birth: formData.date_of_birth || null,
          date_of_death: formData.date_of_death || null,
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as owner in memorial_members
      await supabase.from("memorial_members").insert({
        memorial_id: data.id,
        user_id: userId,
        role: "owner",
        relationship: "Createur",
      })

      router.push(`/app/memorials/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="mb-3 block">Type de memorial</Label>
            <RadioGroup
              value={formData.memorial_type}
              onValueChange={(value) => setFormData({ ...formData, memorial_type: value })}
              className="flex gap-4"
            >
              <label className="flex-1 cursor-pointer">
                <div className={`p-4 rounded-lg border-2 transition-colors ${formData.memorial_type === 'human' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="human" className="sr-only" />
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-center text-sm font-medium">Humain</p>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <div className={`p-4 rounded-lg border-2 transition-colors ${formData.memorial_type === 'pet' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="pet" className="sr-only" />
                  <PawPrint className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-center text-sm font-medium">Animal</p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Prenom et nom"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date de naissance</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date_of_death">Date de deces</Label>
              <Input
                id="date_of_death"
                type="date"
                value={formData.date_of_death}
                onChange={(e) => setFormData({ ...formData, date_of_death: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="place_of_birth">Lieu de naissance</Label>
              <Input
                id="place_of_birth"
                value={formData.place_of_birth}
                onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                placeholder="Ville, Pays"
              />
            </div>
            <div>
              <Label htmlFor="place_of_death">Lieu de deces</Label>
              <Input
                id="place_of_death"
                value={formData.place_of_death}
                onChange={(e) => setFormData({ ...formData, place_of_death: e.target.value })}
                placeholder="Ville, Pays"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="biography">Biographie</Label>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              placeholder="Partagez l'histoire de cette personne..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_public">Memorial public</Label>
              <p className="text-sm text-muted-foreground">
                Visible par tous les utilisateurs
              </p>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Creer le memorial
      </Button>
    </form>
  )
}
