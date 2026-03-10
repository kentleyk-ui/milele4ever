import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app/app-header"
import { NotificationsList } from "@/components/app/notifications-list"
import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        title="Notifications"
        showBack
      />

      <main className="flex-1 pb-24">
        <NotificationsList 
          notifications={notifications || []} 
          userId={user.id}
        />
      </main>
    </div>
  )
}
