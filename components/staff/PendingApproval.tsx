"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, Clock } from "lucide-react"
import { getRoleById } from "@/lib/roles"

interface PendingApprovalProps {
  userId: string
  roleId: string | null
  onApproved: () => void
}

export default function PendingApproval({ userId, roleId, onApproved }: PendingApprovalProps) {
  const [checking, setChecking] = useState(false)
  const role = roleId ? getRoleById(roleId) : null

  useEffect(() => {
    let disposed = false

    const checkNow = async () => {
      const { data } = await supabase
        .from("staff_profiles")
        .select("status")
        .eq("user_id", userId)
        .single()

      if (!disposed && data?.status === "approved") {
        onApproved()
      }
    }

    // Écouter en Realtime le changement de status
    const channel = supabase
      .channel(`staff-approval:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff_profiles",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if ((payload.new as { status: string }).status === "approved") {
            onApproved()
          }
        }
      )
      .subscribe()

    // Vérification immédiate + polling de secours (10s) sans chevauchement
    void checkNow()
    const interval = setInterval(async () => {
      setChecking(true)
      await checkNow()
      if (!disposed) setChecking(false)
    }, 10_000)

    return () => {
      disposed = true
      void supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [userId, onApproved])

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a0f1e 100%)",
      }}
    >
      <div className="w-full max-w-md text-center">
        {/* Icône animée */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-[#d4a853]/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-[#d4a853]/50 animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-[#d4a853]/10 border border-[#d4a853]/40 flex items-center justify-center">
              <Clock size={32} className="text-[#d4a853]" />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-[#d4a853] text-xs font-medium tracking-widest uppercase mb-4">
          <span>✦</span> Aeternum
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">En attente d'approbation</h1>

        {role && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: role.category.color + "20", border: `1px solid ${role.category.color}40` }}>
            <span>{role.category.emoji}</span>
            <span className="text-sm font-medium" style={{ color: role.category.color }}>
              {role.name}
            </span>
          </div>
        )}

        <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto mb-6">
          Ta candidature a été transmise à l'Administrateur Suprême.
          Tu seras notifié dès que ton accès au portail sera accordé.
        </p>

        {/* Notification Telegram */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8 max-w-xs mx-auto">
          <span className="text-2xl">✈️</span>
          <div className="text-left">
            <p className="text-blue-300 text-xs font-semibold">Notification envoyée</p>
            <p className="text-white/40 text-xs">Kent a reçu ta demande sur Telegram</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
          {checking && <Loader2 size={12} className="animate-spin" />}
          <span>Vérification automatique en cours…</span>
        </div>

        <button
          className="mt-8 text-white/30 hover:text-white/50 text-sm transition-colors underline underline-offset-4"
          onClick={async () => {
            await supabase.auth.signOut()
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
