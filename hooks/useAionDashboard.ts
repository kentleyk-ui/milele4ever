"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { AionModule, AionDashboardStats, AionActivity } from "@/types/aion"
import { AION_MODULES } from "@/types/aion"

export function useAionDashboard() {
  const [modules, setModules] = useState<AionModule[]>([])
  const [stats, setStats] = useState<AionDashboardStats>({
    totalContent: 0,
    circleMembers: 0,
    completionPct: 0,
    capsulesPending: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Compter le contenu par type
      const { data: contentData } = await supabase
        .from("content_items")
        .select("content_type")
        .eq("owner_id", user.id)

      const countByType: Record<string, number> = {}
      for (const row of contentData ?? []) {
        countByType[row.content_type] = (countByType[row.content_type] ?? 0) + 1
      }

      const modulesWithCount: AionModule[] = AION_MODULES.map((m) => ({
        ...m,
        count: countByType[m.key] ?? 0,
      }))

      // Membres du cercle
      const { count: circleCount } = await supabase
        .from("circle_members")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .neq("status", "removed")

      // Capsules en attente
      const { count: capsuleCount } = await supabase
        .from("capsules_temporelles")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("status", "scheduled")

      // Activité récente
      const { data: activityData } = await supabase
        .from("aion_activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      const totalContent = contentData?.length ?? 0
      const modulesFilledCount = modulesWithCount.filter(m => m.count > 0).length
      const completionPct = Math.round((modulesFilledCount / AION_MODULES.length) * 100)

      setModules(modulesWithCount)
      setStats({
        totalContent,
        circleMembers: circleCount ?? 0,
        completionPct,
        capsulesPending: capsuleCount ?? 0,
        recentActivity: (activityData as AionActivity[]) ?? [],
      })
    } catch (e) {
      console.error("[useAionDashboard]", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  return { modules, stats, loading, refresh: fetchDashboard }
}
