"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Users, FileText, TrendingUp, Activity, BarChart2 } from "lucide-react"
import AdminUserManagement from "@/components/staff/AdminUserManagement"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"

interface AdminStats {
  totalMembers: number
  totalPublications: number
  newMembersLast7Days: number
  newPublicationsLast7Days: number
  recentMembers: Array<{ id: string; display_name: string | null; email: string; created_at: string }>
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Users; label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 15%, var(--card))` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value.toLocaleString("fr-FR")}</p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState<"analytics" | "users">("analytics")

  useEffect(() => {
    void (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: totalMembers },
        { count: totalPublications },
        { count: newMembersLast7Days },
        { count: newPublicationsLast7Days },
        { data: recentRaw },
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("publications").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("publications").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("profiles").select("id, display_name, email, created_at").order("created_at", { ascending: false }).limit(5),
      ])

      setStats({
        totalMembers: totalMembers ?? 0,
        totalPublications: totalPublications ?? 0,
        newMembersLast7Days: newMembersLast7Days ?? 0,
        newPublicationsLast7Days: newPublicationsLast7Days ?? 0,
        recentMembers: (recentRaw ?? []) as AdminStats["recentMembers"],
      })
    })()
  }, [])

  const TABS = [
    { id: "analytics" as const, label: "Analytics", icon: BarChart2 },
    { id: "users" as const, label: "Gestion comptes", icon: Users },
  ]

  const adminTools = [
    { label: "Gestion des comptes", href: "/admin" },
    { label: "Comptes", href: "/admin" },
    { label: "Données scripts", href: "/admin/scripts-data" },
    { label: "Monark Logs", href: "/admin/monark-console" },
    { label: "Suggestions", href: "/admin/suggestions" },
  ] as const

  const openTool = (tool: (typeof adminTools)[number]) => {
    if (tool.href) {
      router.push(tool.href)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Administration</h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Vue d'ensemble de la plateforme Milele</p>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <LiquidMetalButton
              label="Données scripts"
              width={180}
              height={42}
              fontSize={13}
              tinted
              onClick={() => router.push("/admin/scripts-data")}
            />
            <LiquidMetalButton
              label="Monark Logs"
              width={170}
              height={42}
              fontSize={13}
              tinted
              onClick={() => router.push("/admin/monark-console")}
            />
            <LiquidMetalButton
              label="Monitor"
              width={150}
              height={42}
              fontSize={13}
              tinted
              onClick={() => window.open("https://90476dc8-72c7-43e1-85b3-fb62988fb10c-00-1265c07clrvag.worf.replit.dev/", "_blank", "noopener,noreferrer")}
            />
          </div>
        </div>
      </div>

      <section className="mb-8 rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Tous les outils administratifs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminTools.map((tool) => (
            <button
              key={`${tool.label}-${tool.href}`}
              onClick={() => openTool(tool)}
              className="text-left rounded-xl px-4 py-3 transition-all hover:opacity-90"
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <p className="text-sm font-semibold">{tool.label}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                {tool.href}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 rounded-2xl w-fit" style={{ background: "var(--secondary)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === id ? "var(--card)" : "transparent",
              color: activeTab === id ? "var(--primary)" : "var(--muted-foreground)",
              boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
            }}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {!stats ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "var(--primary)" }} />
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Membres au total" value={stats.totalMembers} color="#3B82F6" />
                <StatCard icon={FileText} label="Publications" value={stats.totalPublications} color="#10B981" />
                <StatCard icon={TrendingUp} label="Nouveaux membres" value={stats.newMembersLast7Days} sub="ces 7 derniers jours" color="#8B5CF6" />
                <StatCard icon={Activity} label="Nouvelles publications" value={stats.newPublicationsLast7Days} sub="ces 7 derniers jours" color="#F59E0B" />
              </div>

              {/* Dernières inscriptions */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Dernières inscriptions</h2>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {stats.recentMembers.length === 0 ? (
                    <p className="px-5 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>Aucun membre pour l'instant.</p>
                  ) : stats.recentMembers.map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                          {((m.display_name ?? m.email).trim()[0] ?? "M").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.display_name ?? m.email.split("@")[0]}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.email}</p>
                        </div>
                      </div>
                      <p className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "users" && <AdminUserManagement />}
    </div>
  )
}

