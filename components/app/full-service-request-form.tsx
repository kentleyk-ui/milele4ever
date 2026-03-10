"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, Heart, Truck, MapPin, Flower2, Music, 
  UtensilsCrossed, FileText, Image, CreditCard, MessageSquare,
  ChevronLeft, ChevronRight, Save, Check, Loader2
} from "lucide-react"

const STEPS = [
  { id: 1, title: "Identite du defunt", icon: User },
  { id: 2, title: "Rites & preferences", icon: Heart },
  { id: 3, title: "Transport mortuaire", icon: Truck },
  { id: 4, title: "Lieu final", icon: MapPin },
  { id: 5, title: "Fleurs & decoration", icon: Flower2 },
  { id: 6, title: "Musique & ambiance", icon: Music },
  { id: 7, title: "Repas & invites", icon: UtensilsCrossed },
  { id: 8, title: "Programme & annonces", icon: FileText },
  { id: 9, title: "Mur memorial", icon: Image },
  { id: 10, title: "Paiement & support", icon: CreditCard },
  { id: 11, title: "Message personnel", icon: MessageSquare },
]

type FormData = {
  // Step 1
  deceased_full_name: string
  deceased_first_names: string
  deceased_age: number | null
  deceased_sex: string
  death_date: string
  death_time: string
  death_location: string
  death_location_type: string
  // Step 2
  religion: string
  religion_other: string
  service_type: string
  // Step 3
  needs_vehicle: boolean
  vehicle_pickup_location: string
  vehicle_type: string
  transport_urgency: string
  // Step 4
  cemetery_crematorium: string
  use_geolocation: boolean
  scatter_ashes: boolean
  scatter_ashes_location: string
  // Step 5
  flowers_options: string[]
  flowers_other: string
  // Step 6
  music_option: string
  music_playlist_url: string
  // Step 7
  needs_catering: boolean
  catering_guest_count: number | null
  catering_type: string[]
  catering_allergies: string
  // Step 8
  auto_generate_program: boolean
  custom_program_text: string
  notification_methods: string[]
  contacts_to_notify: { name: string; contact: string }[]
  // Step 9
  memorial_access: string
  memorial_content_types: string[]
  memorial_notifications: boolean
  // Step 10
  estimated_amount: number | null
  payment_method: string
  needs_human_support: boolean
  support_type: string
  // Step 11
  personal_message: string
  is_confirmed: boolean
}

const initialFormData: FormData = {
  deceased_full_name: "",
  deceased_first_names: "",
  deceased_age: null,
  deceased_sex: "",
  death_date: "",
  death_time: "",
  death_location: "",
  death_location_type: "",
  religion: "",
  religion_other: "",
  service_type: "",
  needs_vehicle: false,
  vehicle_pickup_location: "",
  vehicle_type: "",
  transport_urgency: "",
  cemetery_crematorium: "",
  use_geolocation: false,
  scatter_ashes: false,
  scatter_ashes_location: "",
  flowers_options: [],
  flowers_other: "",
  music_option: "",
  music_playlist_url: "",
  needs_catering: false,
  catering_guest_count: null,
  catering_type: [],
  catering_allergies: "",
  auto_generate_program: true,
  custom_program_text: "",
  notification_methods: [],
  contacts_to_notify: [{ name: "", contact: "" }, { name: "", contact: "" }],
  memorial_access: "prive",
  memorial_content_types: [],
  memorial_notifications: true,
  estimated_amount: null,
  payment_method: "",
  needs_human_support: false,
  support_type: "chat_ia",
  personal_message: "",
  is_confirmed: false,
}

export function FullServiceRequestForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save effect
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (requestId) {
        autoSave()
      }
    }, 2000)
    return () => clearTimeout(saveTimeout)
  }, [formData])

  // Load existing draft on mount
  useEffect(() => {
    loadDraft()
  }, [])

  const loadDraft = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setRequestId(data.id)
      setCurrentStep(data.current_step || 1)
      setFormData({
        deceased_full_name: data.deceased_full_name || "",
        deceased_first_names: data.deceased_first_names || "",
        deceased_age: data.deceased_age,
        deceased_sex: data.deceased_sex || "",
        death_date: data.death_date || "",
        death_time: data.death_time || "",
        death_location: data.death_location || "",
        death_location_type: data.death_location_type || "",
        religion: data.religion || "",
        religion_other: data.religion_other || "",
        service_type: data.service_type || "",
        needs_vehicle: data.needs_vehicle || false,
        vehicle_pickup_location: data.vehicle_pickup_location || "",
        vehicle_type: data.vehicle_type || "",
        transport_urgency: data.transport_urgency || "",
        cemetery_crematorium: data.cemetery_crematorium || "",
        use_geolocation: data.use_geolocation || false,
        scatter_ashes: data.scatter_ashes || false,
        scatter_ashes_location: data.scatter_ashes_location || "",
        flowers_options: data.flowers_options || [],
        flowers_other: data.flowers_other || "",
        music_option: data.music_option || "",
        music_playlist_url: data.music_playlist_url || "",
        needs_catering: data.needs_catering || false,
        catering_guest_count: data.catering_guest_count,
        catering_type: data.catering_type || [],
        catering_allergies: data.catering_allergies || "",
        auto_generate_program: data.auto_generate_program ?? true,
        custom_program_text: data.custom_program_text || "",
        notification_methods: data.notification_methods || [],
        contacts_to_notify: data.contacts_to_notify || [{ name: "", contact: "" }, { name: "", contact: "" }],
        memorial_access: data.memorial_access || "prive",
        memorial_content_types: data.memorial_content_types || [],
        memorial_notifications: data.memorial_notifications ?? true,
        estimated_amount: data.estimated_amount,
        payment_method: data.payment_method || "",
        needs_human_support: data.needs_human_support || false,
        support_type: data.support_type || "chat_ia",
        personal_message: data.personal_message || "",
        is_confirmed: data.is_confirmed || false,
      })
    }
  }

  const autoSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...formData,
      current_step: currentStep,
      user_id: user.id,
    }

    if (requestId) {
      await supabase
        .from("service_requests")
        .update(payload)
        .eq("id", requestId)
    } else {
      const { data } = await supabase
        .from("service_requests")
        .insert(payload)
        .select()
        .single()
      if (data) setRequestId(data.id)
    }

    setLastSaved(new Date())
    setSaving(false)
  }

  const handleSubmit = async () => {
    const supabase = createClient()
    
    if (requestId) {
      await supabase
        .from("service_requests")
        .update({ 
          ...formData,
          status: "submitted",
          is_confirmed: true 
        })
        .eq("id", requestId)
    }

    router.push("/app/services?submitted=true")
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: keyof FormData, value: string) => {
    const arr = formData[field] as string[]
    if (arr.includes(value)) {
      updateField(field, arr.filter(v => v !== value) as FormData[typeof field])
    } else {
      updateField(field, [...arr, value] as FormData[typeof field])
    }
  }

  const nextStep = () => {
    if (currentStep < 11) {
      setCurrentStep(currentStep + 1)
      autoSave()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      autoSave()
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="deceased_full_name">Nom complet</Label>
                <Input
                  id="deceased_full_name"
                  value={formData.deceased_full_name}
                  onChange={e => updateField("deceased_full_name", e.target.value)}
                  placeholder="Nom de famille"
                />
              </div>
              <div>
                <Label htmlFor="deceased_first_names">Prenom(s)</Label>
                <Input
                  id="deceased_first_names"
                  value={formData.deceased_first_names}
                  onChange={e => updateField("deceased_first_names", e.target.value)}
                  placeholder="Prenom(s)"
                />
              </div>
              <div>
                <Label htmlFor="deceased_age">Age</Label>
                <Input
                  id="deceased_age"
                  type="number"
                  value={formData.deceased_age || ""}
                  onChange={e => updateField("deceased_age", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Age en annees"
                />
              </div>
              <div>
                <Label>Sexe</Label>
                <RadioGroup
                  value={formData.deceased_sex}
                  onValueChange={v => updateField("deceased_sex", v)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="homme" id="sex-homme" />
                    <Label htmlFor="sex-homme">Homme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="femme" id="sex-femme" />
                    <Label htmlFor="sex-femme">Femme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="autre" id="sex-autre" />
                    <Label htmlFor="sex-autre">Autre</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="death_date">Date du deces</Label>
                  <Input
                    id="death_date"
                    type="date"
                    value={formData.death_date}
                    onChange={e => updateField("death_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="death_time">Heure approximative</Label>
                  <Input
                    id="death_time"
                    type="time"
                    value={formData.death_time}
                    onChange={e => updateField("death_time", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="death_location">Lieu du deces</Label>
                <Input
                  id="death_location"
                  value={formData.death_location}
                  onChange={e => updateField("death_location", e.target.value)}
                  placeholder="Adresse ou nom de l'etablissement"
                />
              </div>
              <div>
                <Label>Type de lieu</Label>
                <RadioGroup
                  value={formData.death_location_type}
                  onValueChange={v => updateField("death_location_type", v)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hopital" id="loc-hopital" />
                    <Label htmlFor="loc-hopital">Hopital</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="domicile" id="loc-domicile" />
                    <Label htmlFor="loc-domicile">Domicile</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="autre" id="loc-autre" />
                    <Label htmlFor="loc-autre">Autre</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Religion ou rite souhaite</Label>
              <RadioGroup
                value={formData.religion}
                onValueChange={v => updateField("religion", v)}
                className="grid grid-cols-2 gap-2 mt-2"
              >
                {[
                  { value: "musulman", label: "Musulman" },
                  { value: "chretien", label: "Chretien" },
                  { value: "juif", label: "Juif" },
                  { value: "bouddhiste", label: "Bouddhiste" },
                  { value: "laic", label: "Laic" },
                  { value: "autre", label: "Autre" },
                ].map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value={opt.value} id={`rel-${opt.value}`} />
                    <Label htmlFor={`rel-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              {formData.religion === "autre" && (
                <Input
                  className="mt-2"
                  value={formData.religion_other}
                  onChange={e => updateField("religion_other", e.target.value)}
                  placeholder="Precisez..."
                />
              )}
            </div>
            <div>
              <Label>Service principal</Label>
              <RadioGroup
                value={formData.service_type}
                onValueChange={v => updateField("service_type", v)}
                className="grid gap-2 mt-2"
              >
                {[
                  { value: "enterrement", label: "Enterrement" },
                  { value: "cremation", label: "Cremation" },
                  { value: "inhumation_ecologique", label: "Inhumation ecologique" },
                  { value: "ceremonie_virtuelle", label: "Ceremonie virtuelle" },
                  { value: "aucun", label: "Aucun" },
                ].map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value={opt.value} id={`svc-${opt.value}`} />
                    <Label htmlFor={`svc-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="needs_vehicle">Besoin d'un vehicule ?</Label>
              <Switch
                id="needs_vehicle"
                checked={formData.needs_vehicle}
                onCheckedChange={v => updateField("needs_vehicle", v)}
              />
            </div>
            {formData.needs_vehicle && (
              <>
                <div>
                  <Label htmlFor="vehicle_pickup_location">Adresse de prise en charge</Label>
                  <Input
                    id="vehicle_pickup_location"
                    value={formData.vehicle_pickup_location}
                    onChange={e => updateField("vehicle_pickup_location", e.target.value)}
                    placeholder="Adresse complete"
                  />
                </div>
                <div>
                  <Label>Type de vehicule</Label>
                  <RadioGroup
                    value={formData.vehicle_type}
                    onValueChange={v => updateField("vehicle_type", v)}
                    className="grid gap-2 mt-2"
                  >
                    {[
                      { value: "corbillard_standard", label: "Corbillard standard" },
                      { value: "luxe", label: "Luxe" },
                      { value: "minibus_famille", label: "Minibus famille" },
                    ].map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2 border rounded-lg p-3">
                        <RadioGroupItem value={opt.value} id={`veh-${opt.value}`} />
                        <Label htmlFor={`veh-${opt.value}`}>{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label>Urgence</Label>
                  <RadioGroup
                    value={formData.transport_urgency}
                    onValueChange={v => updateField("transport_urgency", v)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24h_max" id="urg-24h" />
                      <Label htmlFor="urg-24h">24h max</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pas_urgence" id="urg-no" />
                      <Label htmlFor="urg-no">Pas d'urgence</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cemetery_crematorium">Cimetiere / Crematorium prefere</Label>
              <Input
                id="cemetery_crematorium"
                value={formData.cemetery_crematorium}
                onChange={e => updateField("cemetery_crematorium", e.target.value)}
                placeholder="Nom ou adresse"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="use_geolocation">Proposer le plus proche (geolocalisation)</Label>
              <Switch
                id="use_geolocation"
                checked={formData.use_geolocation}
                onCheckedChange={v => updateField("use_geolocation", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="scatter_ashes">Dispersion des cendres ?</Label>
              <Switch
                id="scatter_ashes"
                checked={formData.scatter_ashes}
                onCheckedChange={v => updateField("scatter_ashes", v)}
              />
            </div>
            {formData.scatter_ashes && (
              <div>
                <Label htmlFor="scatter_ashes_location">Lieu de dispersion</Label>
                <Input
                  id="scatter_ashes_location"
                  value={formData.scatter_ashes_location}
                  onChange={e => updateField("scatter_ashes_location", e.target.value)}
                  placeholder="Lieu souhaite"
                />
              </div>
            )}
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-4">
            <Label>Options de fleurs et decoration</Label>
            <div className="grid gap-2">
              {[
                { value: "bouquet_classique", label: "Bouquet classique" },
                { value: "couronne_personnalisee", label: "Couronne personnalisee" },
                { value: "bougie_eternelle", label: "Bougie eternelle (virtuelle ou physique)" },
              ].map(opt => (
                <div
                  key={opt.value}
                  className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                    formData.flowers_options.includes(opt.value)
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => toggleArrayField("flowers_options", opt.value)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    formData.flowers_options.includes(opt.value)
                      ? "bg-primary border-primary"
                      : ""
                  }`}>
                    {formData.flowers_options.includes(opt.value) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="flowers_other">Autre (precisez)</Label>
              <Input
                id="flowers_other"
                value={formData.flowers_other}
                onChange={e => updateField("flowers_other", e.target.value)}
                placeholder="Decoration specifique..."
              />
            </div>
          </div>
        )
      
      case 6:
        return (
          <div className="space-y-4">
            <Label>Musique et ambiance</Label>
            <RadioGroup
              value={formData.music_option}
              onValueChange={v => updateField("music_option", v)}
              className="grid gap-2"
            >
              {[
                { value: "playlist_personnelle", label: "Playlist personnelle (je l'upload)" },
                { value: "musique_live", label: "Musique live (organiste / guitariste)" },
                { value: "silence_complet", label: "Silence complet" },
              ].map(opt => (
                <div key={opt.value} className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value={opt.value} id={`mus-${opt.value}`} />
                  <Label htmlFor={`mus-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {formData.music_option === "playlist_personnelle" && (
              <div>
                <Label htmlFor="music_playlist_url">Lien vers la playlist (Spotify, YouTube...)</Label>
                <Input
                  id="music_playlist_url"
                  value={formData.music_playlist_url}
                  onChange={e => updateField("music_playlist_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        )
      
      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="needs_catering">Traiteur ?</Label>
              <Switch
                id="needs_catering"
                checked={formData.needs_catering}
                onCheckedChange={v => updateField("needs_catering", v)}
              />
            </div>
            {formData.needs_catering && (
              <>
                <div>
                  <Label htmlFor="catering_guest_count">Nombre estime de personnes</Label>
                  <Input
                    id="catering_guest_count"
                    type="number"
                    value={formData.catering_guest_count || ""}
                    onChange={e => updateField("catering_guest_count", e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label>Type de repas</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { value: "halal", label: "Halal" },
                      { value: "vegetarien", label: "Vegetarien" },
                      { value: "buffet_simple", label: "Buffet simple" },
                      { value: "repas_assis", label: "Repas assis" },
                    ].map(opt => (
                      <div
                        key={opt.value}
                        className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                          formData.catering_type.includes(opt.value)
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                        onClick={() => toggleArrayField("catering_type", opt.value)}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          formData.catering_type.includes(opt.value)
                            ? "bg-primary border-primary"
                            : ""
                        }`}>
                          {formData.catering_type.includes(opt.value) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="catering_allergies">Allergies / restrictions</Label>
                  <Input
                    id="catering_allergies"
                    value={formData.catering_allergies}
                    onChange={e => updateField("catering_allergies", e.target.value)}
                    placeholder="Precisez les restrictions alimentaires"
                  />
                </div>
              </>
            )}
          </div>
        )
      
      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_generate_program">Programme auto-genere ?</Label>
              <Switch
                id="auto_generate_program"
                checked={formData.auto_generate_program}
                onCheckedChange={v => updateField("auto_generate_program", v)}
              />
            </div>
            {!formData.auto_generate_program && (
              <div>
                <Label htmlFor="custom_program_text">Texte du programme</Label>
                <Textarea
                  id="custom_program_text"
                  value={formData.custom_program_text}
                  onChange={e => updateField("custom_program_text", e.target.value)}
                  placeholder="Texte personnalise pour le programme..."
                  rows={4}
                />
              </div>
            )}
            <div>
              <Label>Envoi automatique des annonces</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: "mail", label: "Email" },
                  { value: "sms", label: "SMS" },
                  { value: "impression", label: "Impression cartes" },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      formData.notification_methods.includes(opt.value)
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => toggleArrayField("notification_methods", opt.value)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      formData.notification_methods.includes(opt.value)
                        ? "bg-primary border-primary"
                        : ""
                    }`}>
                      {formData.notification_methods.includes(opt.value) && (
                        <Check className="w-2 h-2 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Contacts a notifier</Label>
              <div className="space-y-2 mt-2">
                {formData.contacts_to_notify.map((contact, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <Input
                      value={contact.name}
                      onChange={e => {
                        const newContacts = [...formData.contacts_to_notify]
                        newContacts[idx].name = e.target.value
                        updateField("contacts_to_notify", newContacts)
                      }}
                      placeholder="Nom"
                    />
                    <Input
                      value={contact.contact}
                      onChange={e => {
                        const newContacts = [...formData.contacts_to_notify]
                        newContacts[idx].contact = e.target.value
                        updateField("contacts_to_notify", newContacts)
                      }}
                      placeholder="Tel / Email"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField("contacts_to_notify", [...formData.contacts_to_notify, { name: "", contact: "" }])}
                >
                  + Ajouter un contact
                </Button>
              </div>
            </div>
          </div>
        )
      
      case 9:
        return (
          <div className="space-y-4">
            <div>
              <Label>Acces au mur memorial</Label>
              <RadioGroup
                value={formData.memorial_access}
                onValueChange={v => updateField("memorial_access", v)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prive" id="acc-prive" />
                  <Label htmlFor="acc-prive">Prive (famille uniquement)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="acc-public" />
                  <Label htmlFor="acc-public">Public</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Contenu a ajouter</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: "photos", label: "Photos" },
                  { value: "videos", label: "Videos" },
                  { value: "messages", label: "Messages" },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      formData.memorial_content_types.includes(opt.value)
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => toggleArrayField("memorial_content_types", opt.value)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      formData.memorial_content_types.includes(opt.value)
                        ? "bg-primary border-primary"
                        : ""
                    }`}>
                      {formData.memorial_content_types.includes(opt.value) && (
                        <Check className="w-2 h-2 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="memorial_notifications">Notifications souvenirs (anniversaire, date deces)</Label>
              <Switch
                id="memorial_notifications"
                checked={formData.memorial_notifications}
                onCheckedChange={v => updateField("memorial_notifications", v)}
              />
            </div>
          </div>
        )
      
      case 10:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Devis instantane</CardTitle>
                <CardDescription>Calcule automatiquement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formData.estimated_amount ? `${formData.estimated_amount} EUR` : "En cours de calcul..."}
                </div>
              </CardContent>
            </Card>
            <div>
              <Label>Mode de paiement</Label>
              <RadioGroup
                value={formData.payment_method}
                onValueChange={v => updateField("payment_method", v)}
                className="grid gap-2 mt-2"
              >
                {[
                  { value: "carte", label: "Carte bancaire" },
                  { value: "virement", label: "Virement" },
                  { value: "echelonne", label: "Paiement echelonne" },
                ].map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value={opt.value} id={`pay-${opt.value}`} />
                    <Label htmlFor={`pay-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="needs_human_support">Besoin d'un humain 24/7 ?</Label>
              <Switch
                id="needs_human_support"
                checked={formData.needs_human_support}
                onCheckedChange={v => updateField("needs_human_support", v)}
              />
            </div>
            {formData.needs_human_support ? (
              <div>
                <Label>Type de support</Label>
                <RadioGroup
                  value={formData.support_type}
                  onValueChange={v => updateField("support_type", v)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="appel" id="sup-appel" />
                    <Label htmlFor="sup-appel">Appel telephonique</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chat_ia" id="sup-chat" />
                    <Label htmlFor="sup-chat">Chat IA suffit</Label>
                  </div>
                </RadioGroup>
              </div>
            ) : null}
          </div>
        )
      
      case 11:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="personal_message">Message personnel</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Ce message sera affiche sur le mur memorial ou dans le programme
              </p>
              <Textarea
                id="personal_message"
                value={formData.personal_message}
                onChange={e => updateField("personal_message", e.target.value)}
                placeholder="Ecrivez votre message..."
                rows={6}
              />
            </div>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Validation finale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.is_confirmed ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => updateField("is_confirmed", true)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.is_confirmed ? "bg-primary border-primary" : ""
                  }`}>
                    {formData.is_confirmed && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <span className="font-medium">Je confirme : tout est bon, lancez les services</span>
                </div>
                <div
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    !formData.is_confirmed ? "border-muted-foreground/50 bg-muted/5" : ""
                  }`}
                  onClick={() => updateField("is_confirmed", false)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    !formData.is_confirmed ? "bg-muted border-muted-foreground/50" : ""
                  }`}>
                    {!formData.is_confirmed && <div className="w-2 h-2 bg-muted-foreground rounded-full" />}
                  </div>
                  <span>Je reviens plus tard (sauvegarde auto)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  const StepIcon = STEPS[currentStep - 1].icon

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Etape {currentStep} sur 11</span>
          {saving ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sauvegarde...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Save className="w-3 h-3" />
              Sauvegarde auto
            </span>
          ) : null}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / 11) * 100}%` }}
          />
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
              step.id === currentStep
                ? "bg-primary text-primary-foreground"
                : step.id < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <step.icon className="w-3 h-3" />
            <span className="hidden sm:inline">{step.id}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>Etape {currentStep} sur 11</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Precedent
        </Button>
        {currentStep === 11 ? (
          <Button
            onClick={handleSubmit}
            disabled={!formData.is_confirmed}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Confirmer et envoyer
          </Button>
        ) : (
          <Button onClick={nextStep} className="flex-1">
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
