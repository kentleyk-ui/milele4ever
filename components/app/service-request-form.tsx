"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle } from "lucide-react"

interface Memorial {
  id: string
  full_name: string
}

interface Profile {
  full_name: string | null
  phone: string | null
}

interface ServiceRequestFormProps {
  userId: string
  userEmail: string
  profile: Profile | null
  memorials: Memorial[]
}

const serviceTypes = [
  { value: "funeral", label: "Obseques completes" },
  { value: "cremation", label: "Cremation" },
  { value: "memorial_service", label: "Ceremonie commemorative" },
  { value: "transport", label: "Transport funeraire" },
  { value: "flowers", label: "Arrangements floraux" },
  { value: "catering", label: "Reception / Traiteur" },
  { value: "other", label: "Autre service" },
]

const budgetRanges = [
  { value: "less_1000", label: "Moins de 1 000 EUR" },
  { value: "1000_3000", label: "1 000 - 3 000 EUR" },
  { value: "3000_5000", label: "3 000 - 5 000 EUR" },
  { value: "5000_10000", label: "5 000 - 10 000 EUR" },
  { value: "more_10000", label: "Plus de 10 000 EUR" },
  { value: "not_specified", label: "Non specifie" },
]

export function ServiceRequestForm({ userId, userEmail, profile, memorials }: ServiceRequestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    service_type: "",
    memorial_id: "",
    full_name: profile?.full_name || "",
    email: userEmail,
    phone: profile?.phone || "",
    preferred_date: "",
    location: "",
    budget_range: "not_specified",
    details: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("service_requests").insert({
        user_id: userId,
        memorial_id: formData.memorial_id || null,
        service_type: formData.service_type,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        preferred_date: formData.preferred_date || null,
        location: formData.location || null,
        budget_range: formData.budget_range,
        details: formData.details || null,
        status: "pending",
      })

      if (error) throw error

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Demande envoyee</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Nous avons bien recu votre demande. Notre equipe vous contactera sous 24-48h.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Nouvelle demande
          </Button>
        </CardContent>
      </Card>
    )
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
            <Label htmlFor="service_type">Type de service *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              required
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {memorials.length > 0 && (
            <div>
              <Label htmlFor="memorial_id">Memorial associe (optionnel)</Label>
              <Select
                value={formData.memorial_id}
                onValueChange={(value) => setFormData({ ...formData, memorial_id: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selectionner un memorial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {memorials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Vos coordonnees</h3>

          <div>
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Details de la demande</h3>

          <div>
            <Label htmlFor="preferred_date">Date souhaitee</Label>
            <Input
              id="preferred_date"
              type="date"
              value={formData.preferred_date}
              onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ville ou adresse"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="budget_range">Budget approximatif</Label>
            <Select
              value={formData.budget_range}
              onValueChange={(value) => setFormData({ ...formData, budget_range: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="details">Details supplementaires</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Decrivez vos besoins specifiques..."
              rows={4}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading || !formData.service_type || !formData.full_name || !formData.email}>
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Envoyer la demande
      </Button>
    </form>
  )
}
