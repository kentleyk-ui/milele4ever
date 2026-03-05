import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Users, BookOpen } from "lucide-react"

export function Hero() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <Heart className="mr-2 h-3.5 w-3.5 text-primary" />
          Pour toujours dans nos coeurs
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
          Honorez la memoire de ceux que vous aimez
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Milele centralise tous les services essentiels lors d{"'"}un deces et des funerailles.
          Creez des memoriaux, partagez des souvenirs et trouvez les services dont vous avez besoin.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button size="lg" asChild>
            <Link href="/register">Creer un compte</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto w-full">
        <FeatureCard
          icon={<Heart className="h-6 w-6" />}
          title="Memoriaux"
          description="Creez de belles pages memorielles pour humains et animaux de compagnie"
        />
        <FeatureCard
          icon={<Users className="h-6 w-6" />}
          title="Communaute"
          description="Ajoutez famille et amis pour partager des souvenirs et du soutien"
        />
        <FeatureCard
          icon={<BookOpen className="h-6 w-6" />}
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
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
