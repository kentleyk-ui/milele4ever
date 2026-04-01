'use client'

import Link from "next/link"
import { Flower2, Car, ScrollText, PawPrint, UtensilsCrossed, Building } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function ServicesPreview() {
  const { t } = useI18n()

  const services = [
    { icon: Building,        label: t('services.funeralHome'), description: t('services.funeralHomeDesc'), href: "/app/services", featured: true },
    { icon: Flower2,         label: t('services.florists'),    description: t('services.floristsDesc'),    href: "/app/services", featured: false },
    { icon: ScrollText,      label: t('services.notaries'),    description: t('services.notariesDesc'),    href: "/app/services", featured: false },
    { icon: UtensilsCrossed, label: t('services.caterers'),    description: t('services.caterersDesc'),    href: "/app/services", featured: false },
    { icon: Car,             label: t('services.transport'),   description: t('services.transportDesc'),   href: "/app/services", featured: false },
    { icon: PawPrint,        label: t('services.pets'),        description: t('services.petsDesc'),        href: "/pets",         featured: true },
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

        {/*
          Layout : [Salon | Fleuriste Notaire | Compagnons]
                   [      | Traiteur Transport |           ]
          8 colonnes : col 1 = featured left (row-span-2)
                       col 2-4 = Fleuriste / Traiteur (row-span-1 chacun)
                       col 5-7 = Notaire / Transport  (row-span-1 chacun)
                       col 8   = featured right (row-span-2)
        */}
        <div className="grid grid-cols-1 md:grid-cols-8 md:grid-rows-2 gap-3">

          {/* Salon Funéraires — extrémité gauche, pleine hauteur */}
          <Link
            href={services[0].href}
            aria-label={`${services[0].label}: ${services[0].description}`}
            className="
              group md:col-span-2 md:row-span-2 md:col-start-1 md:row-start-1
              flex flex-col items-center justify-center gap-4 p-8
              rounded-2xl
              bg-[#0a1a0e] hover:bg-[#0d2212]
              border border-primary/10 hover:border-primary/25
              transition-all duration-300
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
          >
            <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Building className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base text-white leading-snug">{services[0].label}</p>
              <p className="text-xs text-primary/60 mt-2 leading-relaxed">{services[0].description}</p>
            </div>
          </Link>

          {/* Fleuriste — rang 1, centre gauche */}
          <Link
            href={services[1].href}
            aria-label={`${services[1].label}: ${services[1].description}`}
            className="
              group md:col-span-2 md:row-span-1 md:col-start-3 md:row-start-1
              flex flex-col items-center justify-center gap-3 p-6
              rounded-2xl
              bg-[#0a1a0e] hover:bg-[#0d2212]
              border border-primary/10 hover:border-primary/25
              transition-all duration-300
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
          >
            <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Flower2 className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-white">{services[1].label}</p>
          </Link>

          {/* Notaire — rang 1, centre droit */}
          <Link
            href={services[2].href}
            aria-label={`${services[2].label}: ${services[2].description}`}
            className="
              group md:col-span-2 md:row-span-1 md:col-start-5 md:row-start-1
              flex flex-col items-center justify-center gap-3 p-6
              rounded-2xl
              bg-[#0a1a0e] hover:bg-[#0d2212]
              border border-primary/10 hover:border-primary/25
              transition-all duration-300
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
          >
            <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ScrollText className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-white">{services[2].label}</p>
          </Link>

          {/* Traiteur — rang 2, centre gauche */}
          <Link
            href={services[3].href}
            aria-label={`${services[3].label}: ${services[3].description}`}
            className="
              group md:col-span-2 md:row-span-1 md:col-start-3 md:row-start-2
              flex flex-col items-center justify-center gap-3 p-6
              rounded-2xl
              bg-[#0a1a0e] hover:bg-[#0d2212]
              border border-primary/10 hover:border-primary/25
              transition-all duration-300
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
          >
            <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UtensilsCrossed className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-white">{services[3].label}</p>
          </Link>

          {/* Transport — rang 2, centre droit */}
          <Link
            href={services[4].href}
            aria-label={`${services[4].label}: ${services[4].description}`}
            className="
              group md:col-span-2 md:row-span-1 md:col-start-5 md:row-start-2
              flex flex-col items-center justify-center gap-3 p-6
              rounded-2xl
              bg-[#0a1a0e] hover:bg-[#0d2212]
              border border-primary/10 hover:border-primary/25
              transition-all duration-300
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
          >
            <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Car className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-white">{services[4].label}</p>
          </Link>

          {/* Compagnons à Poils — extrémité droite, pleine hauteur */}
          <Link
            href={services[5].href}
            aria-label={`${services[5].label}: ${services[5].description}`}
            className="
              group md:col-span-2 md:row-span-2 md:col-start-7 md:row-start-1
              flex flex-col items-center justify-center gap-4 p-8
              rounded-2xl
              bg-[#0a1a0e] hover:bg-[#0d2212]
              border border-primary/10 hover:border-primary/25
              transition-all duration-300
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
          >
            <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <PawPrint className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base text-white leading-snug">{services[5].label}</p>
              <p className="text-xs text-primary/60 mt-2 leading-relaxed">{services[5].description}</p>
            </div>
          </Link>

        </div>
      </div>
    </section>
  )
}
