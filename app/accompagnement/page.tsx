import Link from "next/link"

export default function AccompagnementPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Accompagnement</h1>
      <p className="text-base mb-6">Découvrez les services d'accompagnement pour les familles en période de deuil.</p>
      <Link href="/" className="underline">Retour à l'accueil</Link>
    </main>
  )
}
