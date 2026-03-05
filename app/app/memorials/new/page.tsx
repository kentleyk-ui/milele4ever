import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { CreateMemorialForm } from "@/components/app/create-memorial-form"

export default async function NewMemorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="Nouveau Memorial" showBack />
      
      <main className="flex-1 p-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-2">Creer un memorial</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Honorez la memoire d&apos;un etre cher en creant un espace de souvenir
          </p>

          <CreateMemorialForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
