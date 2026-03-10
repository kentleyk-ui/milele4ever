import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/app/app-header"
import { ServiceRequestsList } from "@/components/app/service-requests-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Clock, CheckCircle2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's service requests
  const { data: requests } = await supabase
    .from("service_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const draftRequest = requests?.find(r => r.status === "draft")
  const submittedRequests = requests?.filter(r => r.status !== "draft") || []

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="Services" />

      <main className="flex-1 p-4 pb-24 space-y-6">
        {params.submitted && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800 dark:text-green-200">
                Votre demande a ete soumise avec succes. Nous vous contacterons sous peu.
              </p>
            </CardContent>
          </Card>
        )}

        {/* New request card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Demande de services funeraires
            </CardTitle>
            <CardDescription>
              Formulaire complet pour organiser les services en cas de deces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {draftRequest ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    Brouillon en cours
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Etape {draftRequest.current_step || 1} / 11
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${((draftRequest.current_step || 1) / 11) * 100}%` }}
                  />
                </div>
                <Button asChild className="w-full">
                  <Link href="/app/services/new">
                    Continuer ma demande
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href="/app/services/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle demande de service
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {submittedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Mes demandes</h2>
            <ServiceRequestsList requests={submittedRequests} />
          </div>
        )}
      </main>
    </div>
  )
}
