'use client'

import Link from "next/link"
import { Flower2, Car, ScrollText, PawPrint, UtensilsCrossed, Building } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function ServicesPreview() {
  const { t } = useI18n()

  const services = [
    { icon: Building, label: t('services.funeralHome'), description: t('services.funeralHomeDesc'), href: "/app/services", featured: true },
    { icon: Flower2, label: t('services.florists'), description: t('services.floristsDesc'), href: "/app/services", featured: false },
    { icon: UtensilsCrossed, label: t('services.caterers'), description: t('services.caterersDesc'), href: "/app/services", featured: false },
    { icon: ScrollText, label: t('services.notaries'), description: t('services.notariesDesc'), href: "/app/services", featured: false },
    { icon: Car, label: t('services.transport'), description: t('services.transportDesc'), href: "/app/services", featured: false },
    { icon: PawPrint, label: t('services.pets'), description: t('services.petsDesc'), href: "/pets", featured: true },
  ]

  return (
    <section className="py-16 px-4 bg-muted/50" aria-labelledby="services-heading">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="services-heading" className="font-serif text-2xl font-bold tracking-tight sm:text-3xl mb-4 stagger-item" style={{ animationDelay: '0ms' }}>
            {t('services.heading')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto stagger-item" style={{ animationDelay: '100ms' }}>
            {t('services.description')}
          </p>
        </div>
        
        {/* Bento Grid Layout - 6 colonnes avec disposition esthétique */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(140px,auto)]">
          {services.map((service, index) => {
            let gridSpan = ''
            // Salon funeraire à gauche (index 0) - 2 rangées
            if (index === 0) {
              gridSpan = 'md:col-span-1 md:row-span-2 md:col-start-1 md:row-start-1'
            }
            // Fleuriste (index 1) - rangée 1, colonnes 2-3
            else if (index === 1) {
              gridSpan = 'md:col-span-2 md:row-span-1 md:col-start-2 md:row-start-1'
            }
            // Traiteur (index 2) - rangée 2, colonnes 2-3
            else if (index === 2) {
              gridSpan = 'md:col-span-2 md:row-span-1 md:col-start-2 md:row-start-2'
            }
            // Notaire (index 3) - rangée 1, colonnes 4-5
            else if (index === 3) {
              gridSpan = 'md:col-span-2 md:row-span-1 md:col-start-4 md:row-start-1'
            }
            // Transport (index 4) - rangée 2, colonnes 4-5
            else if (index === 4) {
              gridSpan = 'md:col-span-2 md:row-span-1 md:col-start-4 md:row-start-2'
            }
            // Compagnons à poils à droite (index 5) - 2 rangées
            else if (index === 5) {
              gridSpan = 'md:col-span-1 md:row-span-2 md:col-start-6 md:row-start-1'
            }

            return (
              <Link
                key={service.label}
                href={service.href}
                className={`
                  group flex flex-col items-center justify-center p-6 rounded-xl bg-background border 
                  card-hover stagger-item
                  focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${gridSpan}
                `}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                aria-label={`${service.label}: ${service.description}`}
              >
                <div className={`
                  rounded-full bg-gradient-to-br from-primary/20 to-primary/5 
                  flex items-center justify-center text-primary mb-4
                  group-hover:scale-110 transition-transform duration-300
                  ${service.featured ? 'h-16 w-16' : 'h-12 w-12'}
                `}>
                  <service.icon className={service.featured ? 'h-8 w-8 icon-pulse' : 'h-6 w-6'} />
                </div>
                <span className={`font-medium text-center ${service.featured ? 'text-lg' : 'text-sm'}`}>
                  {service.label}
                </span>
                {service.featured && (
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-[200px]">
                    {service.description}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
