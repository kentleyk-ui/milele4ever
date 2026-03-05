import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PawPrint, Heart } from "lucide-react"

export default function PetsPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/sultan.jpg')" }}
      >
        <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex flex-col items-start justify-start px-6 md:px-12 pt-8 md:pt-16 text-left">
          <div className="max-w-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <PawPrint className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Pour nos amis poilus
              </h1>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Heart className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">Section a venir</span>
                <Heart className="h-4 w-4 fill-current" />
              </div>
              
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                Bientot, vous pourrez creer des memoriaux pour vos compagnons a quatre pattes 
                et acceder a des services funeraires dedies aux animaux de compagnie.
              </p>
              
              <p className="text-sm text-muted-foreground/70 italic">
                Parce qu{"'"}ils font partie de la famille.
              </p>
            </div>
            
            <Button asChild size="sm">
              <Link href="/">
                Retourner a l{"'"}accueil
              </Link>
            </Button>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Product Owner - Kent Ley_CIO © {new Date().getFullYear()} Milele. Tous droits reserves.
          </p>
        </footer>
      </div>
    </div>
  )
}
