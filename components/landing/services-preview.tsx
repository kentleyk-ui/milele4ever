import { Flower2, Car, ScrollText, PawPrint, UtensilsCrossed, Building } from "lucide-react"

const services = [
  { icon: Building, label: "Salons funeraires", description: "Maisons funeraires et crematoriums" },
  { icon: Flower2, label: "Fleuristes", description: "Arrangements floraux et couronnes" },
  { icon: UtensilsCrossed, label: "Traiteurs", description: "Receptions et repas commemoratifs" },
  { icon: ScrollText, label: "Notaires", description: "Services juridiques et succession" },
  { icon: Car, label: "Transport", description: "Services de transport funeraire" },
  { icon: PawPrint, label: "Pour nos amis poilus", description: "Services funeraires pour animaux" },
]

export function ServicesPreview() {
  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
          Tous les services au meme endroit
        </h2>
        <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
          Trouvez et contactez facilement tous les prestataires essentiels lors de cette periode difficile.
          Pour les humains comme pour les animaux de compagnie.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.label}
              className="flex flex-col items-center p-4 rounded-lg bg-background border hover:border-primary/50 transition-colors"
            >
              <service.icon className="h-8 w-8 text-primary mb-3" />
              <span className="font-medium text-sm">{service.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
