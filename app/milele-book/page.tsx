import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  BookOpen, 
  Heart, 
  Users, 
  Leaf, 
  MessageCircle, 
  ArrowRight, 
  Search,
  Clock,
  User
} from "lucide-react"

// Static articles data (in production, this would come from a CMS or database)
const articles = [
  {
    id: "1",
    slug: "accompagner-deuil",
    title: "Comment accompagner un proche en deuil",
    excerpt: "Des conseils pratiques et bienveillants pour soutenir vos proches dans les moments difficiles.",
    category: "Accompagnement",
    readTime: "8 min",
    author: "Équipe Milele",
    date: "2024-03-15",
    icon: Heart,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "2",
    slug: "rituels-culturels-africains",
    title: "Les rituels funéraires dans les cultures africaines",
    excerpt: "Découvrez la richesse et la profondeur des traditions funéraires à travers le continent africain.",
    category: "Culture",
    readTime: "12 min",
    author: "Dr. Amara Diallo",
    date: "2024-03-10",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "3",
    slug: "heritage-numerique",
    title: "Préparer son héritage numérique",
    excerpt: "Guide complet pour organiser sa présence numérique et protéger ses souvenirs pour les générations futures.",
    category: "Guide pratique",
    readTime: "10 min",
    author: "Marie Dupont",
    date: "2024-03-05",
    icon: Leaf,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "4",
    slug: "parler-mort-enfants",
    title: "Comment parler de la mort aux enfants",
    excerpt: "Approches douces et adaptées pour aborder ce sujet délicat avec les plus jeunes.",
    category: "Famille",
    readTime: "7 min",
    author: "Sophie Martin",
    date: "2024-02-28",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
]

const categories = [
  { name: "Tous", count: 12 },
  { name: "Accompagnement", count: 4 },
  { name: "Culture", count: 3 },
  { name: "Guide pratique", count: 3 },
  { name: "Famille", count: 2 },
]

export default function MileleBookPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="font-serif font-bold text-xl">Milele</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Accueil
            </Link>
            <Link href="/milele-book" className="text-sm font-medium">
              Milele Book
            </Link>
            <Link href="/malaika" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Malaika
            </Link>
          </nav>
          <Button asChild variant="default" size="sm">
            <Link href="/auth/login">Connexion</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Ressources et Guides
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Le Milele Book
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Des articles, guides et ressources pour vous accompagner dans les moments importants de la vie et honorer la mémoire de vos proches.
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un article..." 
              className="pl-10 h-12"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <Card className="border-border/50 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Catégories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground">{cat.count}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </aside>

            {/* Articles Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Articles récents</h2>
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {articles.map((article) => (
                  <Card 
                    key={article.id} 
                    className="border-border/50 hover:shadow-lg transition-all duration-300 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${article.bgColor} shrink-0`}>
                          <article.icon className={`h-6 w-6 ${article.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-medium ${article.color}`}>
                            {article.category}
                          </span>
                          <h3 className="font-semibold mt-1 mb-2 group-hover:text-primary transition-colors">
                            <Link href={`/milele-book/${article.slug}`}>
                              {article.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.readTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  Charger plus d&apos;articles
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">
            Restez informé
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Recevez nos derniers articles et ressources directement dans votre boîte mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="Votre email" className="flex-1" />
            <Button>S&apos;inscrire</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Product Owner - Kent Ley_CEO © 2024 Milele. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
