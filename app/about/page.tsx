import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { Heart, TreePine, Hand } from "lucide-react"

export const metadata = {
  title: "A propos",
  description: "Decouvrez Milele, un refuge pour garder vos etres chers pres de vous.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              A propos de nous
            </h1>
            
            <div className="space-y-6 text-lg md:text-xl leading-relaxed">
              <p className="text-2xl md:text-3xl font-medium text-foreground">
                Milele, c{"'"}est pas une appli.<br />
                <span className="text-primary">C{"'"}est un refuge.</span>
              </p>
              
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Milele</span> veut dire <span className="italic">eternite</span> en swahili.<br />
                Et on l{"'"}a choisi parce que l{"'"}amour, lui, ne meurt jamais.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-6 text-lg leading-relaxed text-center">
              <p className="text-muted-foreground">
                On sait ce que c{"'"}est, <span className="font-medium text-foreground">la perte</span>.
              </p>
              
              <p className="text-muted-foreground/80 italic">
                Le silence apres un appel qui ne vient plus.<br />
                Les photos qu{"'"}on regarde en boucle, les nuits ou on cherche un signe.
              </p>
              
              <p className="text-foreground font-medium pt-4">
                Mais on croit que la douleur n{"'"}a pas le dernier mot.
              </p>
              
              <p className="text-muted-foreground">
                On croit qu{"'"}on peut garder quelqu{"'"}un pres de soi –<br />
                <span className="text-foreground">pas comme un fantome, mais comme un souvenir vivant.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-6">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary">
                C{"'"}est pour ca qu{"'"}on a cree Milele :
              </h2>
              
              <div className="space-y-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                <p>
                  Un endroit ou le temps s{"'"}arrete juste assez pour respirer.
                </p>
                <p>
                  Ou une main tendue devient un arbre qui pousse avec toi.
                </p>
                <p>
                  Ou les larmes se transforment en messages, en photos, en <span className="text-primary font-medium">{'"'}je te garde{'"'}</span>.
                </p>
              </div>
            </div>

            {/* Values Cards */}
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <div className="bg-card rounded-xl p-6 text-center border border-border/50 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TreePine className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Un arbre qui grandit</h3>
                <p className="text-sm text-muted-foreground">
                  Chaque souvenir nourrit la memoire de ceux qu{"'"}on aime
                </p>
              </div>
              
              <div className="bg-card rounded-xl p-6 text-center border border-border/50 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Un amour eternel</h3>
                <p className="text-sm text-muted-foreground">
                  L{"'"}amour ne disparait pas, il se transforme
                </p>
              </div>
              
              <div className="bg-card rounded-xl p-6 text-center border border-border/50 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Hand className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Une main tendue</h3>
                <p className="text-sm text-muted-foreground">
                  On s{"'"}occupe de tout, pour que tu puisses respirer
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 px-4 bg-primary/5">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <p className="text-lg md:text-xl text-muted-foreground">
              Et si tout va trop vite,<br />
              <span className="font-semibold text-foreground">on s{"'"}occupe de tout.</span>
            </p>
            
            <p className="text-muted-foreground">
              Tout a portee de main.
            </p>
            
            <p className="font-serif text-2xl md:text-3xl font-semibold text-primary pt-6">
              L{"'"}eternite, elle commence ici.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
