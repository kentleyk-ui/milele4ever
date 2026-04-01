import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <DashboardHeader user={user} profile={profile} />
      
      <div className="flex">
        {/* Sidebar - hidden on mobile, visible on md+ */}
        <DashboardSidebar user={user} profile={profile} />
        
        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-16 md:pt-0">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
