"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function PolitiquePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav className="sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center gap-4"
        style={{ background: "color-mix(in srgb, var(--background) 75%, transparent)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", borderBottom: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))" }}>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--primary)" }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Politique de Confidentialité</h1>
      </nav>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Politique de Confidentialité de Milele
        </h1>
        <p className="text-xs mb-8" style={{ color: "var(--muted-foreground)" }}>
          Dernière mise à jour : 19 avril 2026
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--foreground)" }}>
          Milele traite vos données avec le plus grand respect et la plus stricte confidentialité.
        </p>

        {/* 1. Données collectées */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>1. Données collectées</h2>
          <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
            Nous collectons les informations nécessaires au service :
          </p>
          <ul className="list-disc list-inside text-sm flex flex-col gap-1.5" style={{ color: "var(--muted-foreground)" }}>
            <li>Vos données personnelles (nom, courriel, téléphone)</li>
            <li>Les informations relatives au défunt</li>
            <li>Les documents téléversés</li>
            <li>La liste des personnes à prévenir</li>
            <li>Les conversations avec Malaika</li>
          </ul>
        </section>

        {/* 2. Utilisation des données */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>2. Utilisation des données</h2>
          <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
            Vos données sont utilisées uniquement pour :
          </p>
          <ul className="list-disc list-inside text-sm flex flex-col gap-1.5" style={{ color: "var(--muted-foreground)" }}>
            <li>Fournir l&apos;Assistant de Deuil et organiser les démarches</li>
            <li>Assurer l&apos;accompagnement par Malaika</li>
            <li>Envoyer les notifications demandées</li>
          </ul>
        </section>

        {/* 3. Partage des données */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>3. Partage des données</h2>
          <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
            Nous ne vendons ni ne divulguons vos données à des fins commerciales. Le partage est limité aux cas suivants :
          </p>
          <ul className="list-disc list-inside text-sm flex flex-col gap-1.5" style={{ color: "var(--muted-foreground)" }}>
            <li>Prestataires funéraires que vous sélectionnez</li>
            <li>Obligations légales</li>
            <li>Sous-traitants techniques liés par des contrats de confidentialité</li>
          </ul>
        </section>

        {/* 4. Intelligence artificielle */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>4. Intelligence artificielle (Malaika)</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Les conversations avec Malaika sont strictement confidentielles et ne sont utilisées que pour vous accompagner.
            Elles ne servent jamais à entraîner des modèles d&apos;IA ni à être partagées avec des tiers.
          </p>
        </section>

        {/* 5. Sécurité et conservation */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>5. Sécurité et conservation</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Les données sont chiffrées et stockées au Canada, conformément à la Loi 25 du Québec.
            Nous les conservons uniquement le temps nécessaire au service, sauf obligation légale.
          </p>
        </section>

        {/* 6. Vos droits */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>6. Vos droits</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Vous pouvez à tout moment accéder, rectifier ou supprimer vos données en écrivant à :{" "}
            <a href="mailto:privacy@milele4ever.com" className="underline" style={{ color: "var(--primary)" }}>
              privacy@milele4ever.com
            </a>
          </p>
        </section>

        <div className="mt-12 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            En créant un compte et en utilisant Milele, vous acceptez cette Politique de Confidentialité.
          </p>
        </div>
      </article>
    </div>
  )
}
