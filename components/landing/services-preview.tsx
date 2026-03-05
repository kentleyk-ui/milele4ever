import { Flower2, Car, ScrollText, Stethoscope, UtensilsCrossed, Building } from "lucide-react"

const services = [
  { icon: Building, label: "Salons funeraires", description: "Maisons funeraires et crematoriums" },
  { icon: Flower2, label: "Fleuristes", description: "Arrangements floraux et couronnes" },
  { icon: UtensilsCrossed, label: "Traiteurs", description: "Receptions et repas commemoratifs" },
  { icon: ScrollText, label: "Notaires", description: "Services juridiques et succession" },
  { icon: Car, label: "Transport", description: "Services de transport funeraire" },
  { icon: Stethoscope, label: "Veterinaires", description: "Services funeraires pour animaux" },
]

export function ServicesPreview() {
  return (
    <section className="flex flex-col items-center gap-10 px-6 py-20 md:px-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
          Tous les services au meme endroit
        </h2>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Trouvez et contactez facilement tous les prestataires essentiels lors de cette periode difficile.
          Pour les humains comme pour les animaux de compagnie.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {services.map((service) => (
          <div
            key={service.label}
            className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-5 text-center shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
              <service.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-card-foreground">{service.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
