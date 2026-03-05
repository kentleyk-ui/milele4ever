import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TreePine, Heart, MousePointerClick } from "lucide-react"

export function Hero() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-28 text-center">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
          Bienvenue sur <span className="text-primary">Milele</span>.
        </h1>
        
        <div className="space-y-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          <p className="text-xl md:text-2xl font-medium text-foreground">
            Ici, on ne dit pas adieu.<br />
            On dit : <span className="text-primary font-semibold">« Je te garde »</span>.
          </p>
          
          <p className="text-lg md:text-xl">
            Tes etres chers ne s{"'"}en vont pas.<br />
            <span className="font-medium text-foreground">Ils restent.</span>
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground/80 italic leading-relaxed">
            Dans un arbre qui grandit avec toi,<br />
            dans un mur ou tu reviens quand tu veux,<br />
            dans un souvenir qui arrive le jour ou t{"'"}en as besoin.
          </p>
          
          <p className="text-lg md:text-xl pt-2">
            Et si tout va trop vite,<br />
            <span className="font-semibold text-foreground">on s{"'"}occupe de tout.</span><br />
            <span className="text-base">Il suffit de quelques clics.</span>
          </p>
          
          <p className="text-sm md:text-base text-muted-foreground/60 pt-2">
            Parce que la mort, c{"'"}est deja assez.
          </p>
          
          <p className="font-serif text-2xl md:text-3xl font-semibold text-primary pt-6">
            L{"'"}eternite, elle commence ici.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button size="lg" className="text-base px-8 py-6" asChild>
            <Link href="/auth/sign-up">Commencer</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 py-6" asChild>
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto w-full">
        <FeatureCard
          icon={<TreePine className="h-7 w-7" />}
          title="Un arbre qui grandit"
          description="Creez un memorial vivant qui evolue avec vos souvenirs"
        />
        <FeatureCard
          icon={<Heart className="h-7 w-7" />}
          title="Un mur pour revenir"
          description="Un espace ou famille et amis se retrouvent, quand ils veulent"
        />
        <FeatureCard
          icon={<MousePointerClick className="h-7 w-7" />}
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
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5">
        {icon}
      </div>
      <h3 className="font-serif font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
