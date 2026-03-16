'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useI18n } from "@/lib/i18n/context"
import { LandingHeader } from "@/components/landing/landing-header"
import { 
  Building, Flower2, UtensilsCrossed, ScrollText, Car, Music, 
  Camera, Heart, Users, ChevronRight, ChevronLeft, Calculator,
  CheckCircle2, ArrowRight
} from "lucide-react"

type ServiceOption = {
  id: string
  icon: React.ElementType
  label: string
  description: string
  basePriceXAF: number
}

type CeremonyType = 'religious' | 'civil' | 'intimate' | 'none'

export default function SimulatorPage() {
  const { t, language, formatPrice } = useI18n()
  const [step, setStep] = useState(1)
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>('civil')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [guestCount, setGuestCount] = useState<'small' | 'medium' | 'large'>('medium')
  const [showResults, setShowResults] = useState(false)

  // Prices in FCFA (XAF)
  const services: ServiceOption[] = [
    { 
      id: 'funeral_home', 
      icon: Building, 
      label: language === 'fr' ? 'Salon funeraire' : 'Funeral Home',
      description: language === 'fr' ? 'Organisation et preparation' : 'Organization and preparation',
      basePriceXAF: 2500000
    },
    { 
      id: 'flowers', 
      icon: Flower2, 
      label: language === 'fr' ? 'Fleurs' : 'Flowers',
      description: language === 'fr' ? 'Arrangements floraux' : 'Floral arrangements',
      basePriceXAF: 150000
    },
    { 
      id: 'catering', 
      icon: UtensilsCrossed, 
      label: language === 'fr' ? 'Traiteur' : 'Catering',
      description: language === 'fr' ? 'Reception et repas' : 'Reception and meals',
      basePriceXAF: 500000
    },
    { 
      id: 'notary', 
      icon: ScrollText, 
      label: language === 'fr' ? 'Notaire' : 'Notary',
      description: language === 'fr' ? 'Services juridiques' : 'Legal services',
      basePriceXAF: 200000
    },
    { 
      id: 'transport', 
      icon: Car, 
      label: language === 'fr' ? 'Transport' : 'Transport',
      description: language === 'fr' ? 'Vehicules funeraires' : 'Funeral vehicles',
      basePriceXAF: 300000
    },
    { 
      id: 'music', 
      icon: Music, 
      label: language === 'fr' ? 'Musique' : 'Music',
      description: language === 'fr' ? 'Musiciens ou sonorisation' : 'Musicians or sound system',
      basePriceXAF: 150000
    },
    { 
      id: 'photography', 
      icon: Camera, 
      label: language === 'fr' ? 'Photographie' : 'Photography',
      description: language === 'fr' ? 'Souvenir de la ceremonie' : 'Ceremony memories',
      basePriceXAF: 100000
    },
    { 
      id: 'memorial', 
      icon: Heart, 
      label: language === 'fr' ? 'Memorial Milele' : 'Milele Memorial',
      description: language === 'fr' ? 'Memorial numerique eternel' : 'Eternal digital memorial',
      basePriceXAF: 0
    },
  ]

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const calculateEstimate = () => {
    let total = 0
    const guestMultiplier = guestCount === 'small' ? 0.7 : guestCount === 'large' ? 1.5 : 1
    const ceremonyMultiplier = ceremonyType === 'religious' ? 1.2 : ceremonyType === 'intimate' ? 0.6 : ceremonyType === 'none' ? 0.3 : 1

    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId)
      if (service) {
        let price = service.basePriceXAF
        if (['catering', 'flowers'].includes(serviceId)) {
          price *= guestMultiplier
        }
        if (['funeral_home', 'music'].includes(serviceId)) {
          price *= ceremonyMultiplier
        }
        total += price
      }
    })

    return Math.round(total)
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      setShowResults(true)
    }
  }

  const handleBack = () => {
    if (showResults) {
      setShowResults(false)
    } else if (step > 1) {
      setStep(step - 1)
    }
  }

  const resetSimulator = () => {
    setStep(1)
    setCeremonyType('civil')
    setSelectedServices([])
    setGuestCount('medium')
    setShowResults(false)
  }

  if (showResults) {
    const estimate = calculateEstimate()
    const selectedServicesList = services.filter(s => selectedServices.includes(s.id))

    return (
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="container max-w-2xl mx-auto px-4 py-8">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">
                {language === 'fr' ? 'Votre estimation' : 'Your Estimate'}
              </CardTitle>
              <CardDescription>
                {language === 'fr' 
                  ? 'Basee sur vos selections' 
                  : 'Based on your selections'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total estimate */}
              <div className="text-center py-6 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'fr' ? 'Estimation totale' : 'Total Estimate'}
                </p>
                <p className="text-4xl font-bold text-primary">
                  {formatPrice(estimate)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {language === 'fr' 
                    ? '* Estimation indicative, les prix peuvent varier' 
                    : '* Indicative estimate, prices may vary'}
                </p>
              </div>

              {/* Selected services breakdown */}
              <div className="space-y-3">
                <h3 className="font-medium">
                  {language === 'fr' ? 'Services selectionnes' : 'Selected Services'}
                </h3>
                {selectedServicesList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedServicesList.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <service.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm">{service.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {service.basePriceXAF > 0 ? formatPrice(service.basePriceXAF) : (language === 'fr' ? 'Gratuit' : 'Free')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Aucun service selectionne' : 'No services selected'}
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'fr' ? 'Type de ceremonie' : 'Ceremony type'}
                  </span>
                  <span>
                    {ceremonyType === 'religious' && (language === 'fr' ? 'Religieuse' : 'Religious')}
                    {ceremonyType === 'civil' && (language === 'fr' ? 'Civile' : 'Civil')}
                    {ceremonyType === 'intimate' && (language === 'fr' ? 'Intime' : 'Intimate')}
                    {ceremonyType === 'none' && (language === 'fr' ? 'Sans ceremonie' : 'No ceremony')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'fr' ? 'Nombre de personnes' : 'Number of guests'}
                  </span>
                  <span>
                    {guestCount === 'small' && (language === 'fr' ? 'Moins de 30' : 'Less than 30')}
                    {guestCount === 'medium' && '30 - 80'}
                    {guestCount === 'large' && (language === 'fr' ? 'Plus de 80' : 'More than 80')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/sign-up">
                    {language === 'fr' ? 'Creer mon compte' : 'Create my account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" onClick={resetSimulator} className="w-full">
                  {language === 'fr' ? 'Refaire une simulation' : 'New simulation'}
                </Button>
                <Button variant="ghost" onClick={handleBack} className="w-full">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Modifier mes choix' : 'Edit my choices'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <Calculator className="w-4 h-4" />
            {language === 'fr' ? 'Simulateur' : 'Simulator'}
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">
            {language === 'fr' ? 'Estimez vos besoins' : 'Estimate your needs'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'fr' 
              ? 'Obtenez une estimation personnalisee en quelques etapes' 
              : 'Get a personalized estimate in a few steps'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div 
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-2 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {step === 1 && (language === 'fr' ? 'Type de ceremonie' : 'Ceremony Type')}
              {step === 2 && (language === 'fr' ? 'Nombre de personnes' : 'Number of Guests')}
              {step === 3 && (language === 'fr' ? 'Services souhaites' : 'Desired Services')}
            </CardTitle>
            <CardDescription>
              {step === 1 && (language === 'fr' ? 'Choisissez le type de ceremonie' : 'Choose the ceremony type')}
              {step === 2 && (language === 'fr' ? 'Combien de personnes attendez-vous?' : 'How many guests do you expect?')}
              {step === 3 && (language === 'fr' ? 'Selectionnez les services dont vous avez besoin' : 'Select the services you need')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Ceremony type */}
            {step === 1 && (
              <RadioGroup value={ceremonyType} onValueChange={(v) => setCeremonyType(v as CeremonyType)} className="space-y-3">
                {[
                  { value: 'religious', label: language === 'fr' ? 'Ceremonie religieuse' : 'Religious ceremony', desc: language === 'fr' ? 'Eglise, mosquee, synagogue...' : 'Church, mosque, synagogue...' },
                  { value: 'civil', label: language === 'fr' ? 'Ceremonie civile' : 'Civil ceremony', desc: language === 'fr' ? 'Salle de reception ou crematorium' : 'Reception hall or crematorium' },
                  { value: 'intimate', label: language === 'fr' ? 'Ceremonie intime' : 'Intimate ceremony', desc: language === 'fr' ? 'Petit comite, famille proche' : 'Small group, close family' },
                  { value: 'none', label: language === 'fr' ? 'Sans ceremonie' : 'No ceremony', desc: language === 'fr' ? 'Organisation simplifiee' : 'Simplified organization' },
                ].map(option => (
                  <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setCeremonyType(option.value as CeremonyType)}>
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <span className="font-medium">{option.label}</span>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Step 2: Guest count */}
            {step === 2 && (
              <RadioGroup value={guestCount} onValueChange={(v) => setGuestCount(v as 'small' | 'medium' | 'large')} className="space-y-3">
                {[
                  { value: 'small', label: language === 'fr' ? 'Moins de 30 personnes' : 'Less than 30 guests', icon: Users },
                  { value: 'medium', label: '30 - 80 ' + (language === 'fr' ? 'personnes' : 'guests'), icon: Users },
                  { value: 'large', label: language === 'fr' ? 'Plus de 80 personnes' : 'More than 80 guests', icon: Users },
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-3 p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setGuestCount(option.value as 'small' | 'medium' | 'large')}>
                    <RadioGroupItem value={option.value} id={option.value} />
                    <option.icon className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Step 3: Services */}
            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedServices.includes(service.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <Checkbox 
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <service.icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{service.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.basePriceXAF > 0 ? formatPrice(service.basePriceXAF) : (language === 'fr' ? 'Gratuit' : 'Free')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Retour' : 'Back'}
              </Button>
              <Button onClick={handleNext}>
                {step === 3 
                  ? (language === 'fr' ? 'Voir le resultat' : 'See result')
                  : (language === 'fr' ? 'Suivant' : 'Next')
                }
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
