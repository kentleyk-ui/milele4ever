"use client"

import { useState, useEffect } from "react"
import { ROLE_CATEGORIES } from "@/lib/roles"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, Lock } from "lucide-react"

interface ChooseRoleProps {
  userId: string
  userEmail: string
  onRoleChosen: () => void
}

export default function ChooseRole({ userId, userEmail, onRoleChosen }: ChooseRoleProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [takenRoles, setTakenRoles] = useState<Set<string>>(new Set())
  const [loadingRoles, setLoadingRoles] = useState(true)

  const isKent = userEmail === "kentleyk@gmail.com"

  // Charger les rôles déjà pris (status != rejected pour qu'un refusé libère son rôle)
  useEffect(() => {
    supabase
      .from("staff_profiles")
      .select("role_id, status")
      .neq("status", "rejected")
      .neq("user_id", userId)
      .then(({ data }) => {
        const taken = new Set<string>(
          (data ?? []).map((p: { role_id: string | null }) => p.role_id).filter(Boolean) as string[]
        )
        setTakenRoles(taken)
        setLoadingRoles(false)
      })
  }, [userId])

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError(null)

    const role = (ROLE_CATEGORIES as unknown as Array<{ roles: Array<{ id: string; name: string; description?: string; locked?: boolean; lockedTo?: string }> }>).flatMap(c => c.roles).find(r => r.id === selected)
    const category = ROLE_CATEGORIES.find(c => c.roles.some(r => r.id === selected))
    if (!role || !category) { setLoading(false); return }

    const newStatus = isKent && selected === "admin-supreme" ? "approved" : "pending_approval"

    const { error: upsertError } = await supabase
      .from("staff_profiles")
      .upsert({
        user_id: userId,
        role: selected,
        email: userEmail,
        role_id: selected,
        role_name: role.name,
        role_category: category.id,
        status: newStatus,
        ...(isKent && selected === "admin-supreme" ? {
          approved_at: new Date().toISOString(),
        } : {}),
      }, { onConflict: "user_id" })

    if (upsertError) {
      setError(upsertError.message)
    } else {
      // Notifier Kent par Telegram si ce n'est pas lui-même
      if (newStatus === "pending_approval") {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          console.warn("[ChooseRole] Token manquant: notification Telegram non envoyee.")
        } else {
        await fetch("/api/staff/notify-telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId,
            userEmail,
            roleId: selected,
            roleName: role.name,
            fullName: undefined,
          }),
        }).catch(() => null) // Ne pas bloquer si Telegram échoue
        }
      }
      onRoleChosen()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a0f1e 100%)",
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[#d4a853] text-sm font-medium tracking-widest uppercase mb-4">
            <span className="text-xl">✦</span> Aeternum
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Choisis ton rôle</h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Ton rôle définit ta place et ta mission au sein du Staff Aeternum.
            {!isKent && " Il sera soumis à l'approbation de l'Administrateur Suprême."}
          </p>
        </div>

        {/* Categories */}
        {loadingRoles ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-white/30" /></div>
        ) : (
        <div className="space-y-6">
          {ROLE_CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-sm font-semibold" style={{ color: cat.color }}>
                  {cat.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.roles.map((role) => {
                  const isLocked = "locked" in role && role.locked && !isKent
                  const isTaken = takenRoles.has(role.id)
                  const isDisabled = isLocked || isTaken
                  const isSelected = selected === role.id
                  return (
                    <button
                      key={role.id}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelected(role.id)}
                      className={`relative text-left px-4 py-3 rounded-xl border transition-all duration-200 group ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed border-white/10 bg-white/5"
                          : isSelected
                          ? "border-white/40 bg-white/10 shadow-lg"
                          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                      }`}
                      style={isSelected ? { borderColor: cat.color + "80", boxShadow: `0 0 15px ${cat.color}20` } : {}}
                    >
                      {isLocked && !isTaken && (
                        <Lock size={12} className="absolute top-2 right-2 text-white/30" />
                      )}
                      {isTaken && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/30 border border-white/10">Pris</span>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full"
                          style={{ background: cat.color }} />
                      )}
                      <div className="font-semibold text-white text-sm mb-1">{role.name}</div>
                      <div className="text-white/40 text-xs leading-snug">{role.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Submit */}
        <div className="mt-10 flex flex-col items-center gap-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            disabled={!selected || loading}
            onClick={handleSubmit}
            className="px-8 py-3 rounded-2xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selected ? "linear-gradient(135deg, #d4a853, #b8892e)" : "rgba(255,255,255,0.1)",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Enregistrement…</span>
            ) : (
              isKent && selected === "admin-supreme"
                ? "✦ Accéder au portail"
                : "Soumettre pour approbation →"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
