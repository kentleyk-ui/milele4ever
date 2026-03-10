'use client'

import Link from "next/link"
import { Flower2, Car, ScrollText, PawPrint, UtensilsCrossed, Building } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function ServicesPreview() {
  const { t } = useI18n()

  const services = [
    { icon: Building, label: t('services.funeralHome'), description: t('services.funeralHomeDesc'), href: "/app/services" },
    { icon: Flower2, label: t('services.florists'), description: t('services.floristsDesc'), href: "/app/services" },
    { icon: UtensilsCrossed, label: t('services.caterers'), description: t('services.caterersDesc'), href: "/app/services" },
    { icon: ScrollText, label: t('services.notaries'), description: t('services.notariesDesc'), href: "/app/services" },
    { icon: Car, label: t('services.transport'), description: t('services.transportDesc'), href: "/app/services" },
    { icon: PawPrint, label: t('services.pets'), description: t('services.petsDesc'), href: "/pets" },
  ]

  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl mb-4">
          {t('services.heading')}
        </h2>
        <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
          {t('services.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((service) => (
            <Link
              key={service.label}
              href={service.href}
              className="flex flex-col items-center p-4 rounded-lg bg-background border hover:border-primary/50 hover:shadow-md transition-all"
            >
              <service.icon className="h-8 w-8 text-primary mb-3" />
              <span className="font-medium text-sm">{service.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
