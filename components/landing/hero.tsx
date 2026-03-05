import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Users, BookOpen } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pb-20 pt-24 text-center md:px-12 lg:pt-32 lg:pb-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8">
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
          <Heart className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Pour toujours dans nos coeurs</span>
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Honorez la memoire de ceux que vous aimez
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          Milele centralise tous les services essentiels lors d{"'"}un deces et des funerailles.
          Creez des memoriaux, partagez des souvenirs et trouvez les services dont vous avez besoin.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="px-8 text-base">
            <Link href="/auth/sign-up">Creer un compte</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8 text-base">
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={<BookOpen className="h-6 w-6" />}
          title="Memoriaux"
          description="Creez de belles pages memorielles pour humains et animaux de compagnie"
        />
        <FeatureCard
          icon={<Users className="h-6 w-6" />}
          title="Communaute"
          description="Ajoutez famille et amis pour partager des souvenirs et du soutien"
        />
        <FeatureCard
          icon={<Heart className="h-6 w-6" />}
          title="Services"
          description="Trouvez tous les prestataires funeraires au meme endroit"
        />
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
