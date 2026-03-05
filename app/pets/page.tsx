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
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="max-w-lg mx-auto space-y-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <PawPrint className="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Pour nos amis poilus
              </h1>
              
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">Section a venir</span>
                <Heart className="h-4 w-4 fill-current" />
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Bientot, vous pourrez creer des memoriaux pour vos compagnons a quatre pattes 
                et acceder a des services funeraires dedies aux animaux de compagnie.
              </p>
              
              <p className="text-sm text-muted-foreground/70 italic">
                Parce qu{"'"}ils font partie de la famille.
              </p>
            </div>
            
            <Button asChild className="mt-8">
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
