import Link from "next/link"

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <p className="text-base mb-6">Contactez l'équipe Milele pour toute question sur les hommages et l'accompagnement.</p>
      <Link href="/" className="underline">Retour à l'accueil</Link>
    </main>
  )
}
