"use client"

import { AppHeader } from "@/components/app/app-header"
import { FullServiceRequestForm } from "@/components/app/full-service-request-form"

export default function NewServiceRequestPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Demande de services" showBack />
      <main className="px-4 py-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Remplissez ce formulaire a votre rythme. Toutes vos reponses sont sauvegardees automatiquement.
          </p>
        </div>
        <FullServiceRequestForm />
      </main>
    </div>
  )
}
