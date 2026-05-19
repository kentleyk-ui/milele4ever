"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { CircleMember, VisibilityLevel } from "@/types/aion"

export function useCircle() {
  const [members, setMembers] = useState<CircleMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setMembers([]); setLoading(false); return }

      const { data, error: err } = await supabase
        .from("circle_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })

      if (err) { setError(err.message); setMembers([]) }
      else setMembers((data as CircleMember[]) ?? [])
    } catch {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()

    const channel = supabase
      .channel("circle_members_changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "circle_members",
      }, () => fetchMembers())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMembers])

  const inviteMember = useCallback(async (
    email: string,
    displayName: string,
    visibilityLevel: VisibilityLevel = "famille",
    role: "member" | "executor" | "guardian" = "member"
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Non authentifié" }

    const { error: err } = await supabase.from("circle_members").insert({
      owner_id: user.id,
      email,
      display_name: displayName || null,
      visibility_level: visibilityLevel,
      role,
      status: "pending",
    })

    if (!err) await fetchMembers()
    return { error: err?.message ?? null }
  }, [fetchMembers])

  const removeMember = useCallback(async (memberId: string) => {
    const { error: err } = await supabase
      .from("circle_members")
      .update({ status: "removed" })
      .eq("id", memberId)

    if (!err) await fetchMembers()
    return { error: err?.message ?? null }
  }, [fetchMembers])

  const updateMemberLevel = useCallback(async (memberId: string, level: VisibilityLevel) => {
    const { error: err } = await supabase
      .from("circle_members")
      .update({ visibility_level: level })
      .eq("id", memberId)

    if (!err) await fetchMembers()
    return { error: err?.message ?? null }
  }, [fetchMembers])

  const activeMembers = members.filter((m) => m.status !== "removed")

  const membersByLevel: Record<VisibilityLevel, CircleMember[]> = {
    intime: activeMembers.filter(m => m.visibility_level === "intime"),
    famille: activeMembers.filter(m => m.visibility_level === "famille"),
    amis: activeMembers.filter(m => m.visibility_level === "amis"),
    public: activeMembers.filter(m => m.visibility_level === "public"),
  }

  return { members, activeMembers, membersByLevel, loading, error, inviteMember, removeMember, updateMemberLevel, refresh: fetchMembers }
}
