import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { ServiceRequestForm } from "@/components/app/service-request-form"
import { ServiceRequestsList } from "@/components/app/service-requests-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's service requests
  const { data: requests } = await supabase
    .from("service_requests")
    .select(`
      *,
      memorials(full_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get user's memorials for the form
  const { data: memorials } = await supabase
    .from("memorials")
    .select("id, full_name")
    .eq("created_by", user.id)
    .order("full_name")

  // Get user profile for pre-filling form
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="Services" />

      <main className="flex-1 p-4 pb-24">
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="request">Nouvelle demande</TabsTrigger>
            <TabsTrigger value="history">Mes demandes</TabsTrigger>
          </TabsList>

          <TabsContent value="request">
            <div className="max-w-lg mx-auto">
              <h2 className="text-xl font-semibold mb-2">Demande de service</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Remplissez ce formulaire pour demander un service funeraire ou memorial
              </p>
              <ServiceRequestForm 
                userId={user.id}
                userEmail={user.email || ""}
                profile={profile}
                memorials={memorials || []}
              />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ServiceRequestsList requests={requests || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
