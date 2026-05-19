import Link from "next/link"

export default function MonArbrePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Mon Arbre</h1>
      <p className="text-base mb-6">Visualisez et enrichissez l'arbre de transmission mémorielle de votre famille.</p>
      <Link href="/" className="underline">Retour à l'accueil</Link>
    </main>
  )
}
