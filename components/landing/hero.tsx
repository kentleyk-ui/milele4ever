import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TreePine, Heart, MousePointerClick } from "lucide-react"

export function Hero() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
          Bienvenue sur Milele.
        </h1>
        
        <div className="space-y-4 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          <p className="font-medium text-foreground">
            Ici, on ne dit pas adieu.<br />
            On dit : <span className="text-primary">« Je te garde »</span>.
          </p>
          
          <p className="text-lg md:text-xl text-pretty">
            Tes etres chers ne s{"'"}en vont pas.<br />
            Ils restent.
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground/80 italic">
            Dans un arbre qui grandit avec toi,<br />
            dans un mur ou tu reviens quand tu veux,<br />
            dans un souvenir qui arrive le jour ou t{"'"}en as besoin.
          </p>
          
          <p className="text-lg md:text-xl pt-4">
            Et si tout va trop vite,<br />
            <span className="font-medium text-foreground">on s{"'"}occupe de tout.</span><br />
            Il suffit de quelques clics.
          </p>
          
          <p className="text-base text-muted-foreground/70 pt-2">
            Parce que la mort, c{"'"}est deja assez.
          </p>
          
          <p className="text-xl md:text-2xl font-semibold text-primary pt-4">
            L{"'"}eternite, elle commence ici.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Commencer</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto w-full">
        <FeatureCard
          icon={<TreePine className="h-6 w-6" />}
          title="Un arbre qui grandit"
          description="Creez un memorial vivant qui evolue avec vos souvenirs"
        />
        <FeatureCard
          icon={<Heart className="h-6 w-6" />}
          title="Un mur pour revenir"
          description="Un espace ou famille et amis se retrouvent, quand ils veulent"
        />
        <FeatureCard
          icon={<MousePointerClick className="h-6 w-6" />}
          title="Quelques clics"
          description="On s'occupe de tout. Services funeraires simplifies."
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
