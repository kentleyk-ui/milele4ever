"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { KeyRound, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      setError("Configuration Supabase manquante.")
      return
    }
    setSupabase(createClient(url, anonKey))
  }, [])

  useEffect(() => {
    if (!supabase) return

    // Supabase émet PASSWORD_RECOVERY quand il détecte le token de reset dans l'URL
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })

    // Vérification immédiate : si déjà une session recovery active
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async () => {
    if (!supabase) {
      setError("Client d'authentification indisponible.")
      return
    }

    setError("")
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError("Erreur lors de la mise à jour : " + updateError.message)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push("/espace"), 2500)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  const inputStyle = {
    background: "var(--secondary)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 sm:p-8"
        style={{
          background: "color-mix(in srgb, var(--card) 88%, transparent)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px oklch(0.08 0.04 150 / 0.25)",
        }}
      >
        {/* Icône + titre */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "var(--secondary)" }}
          >
            <KeyRound size={26} style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="text-xl font-semibold text-center" style={{ color: "var(--foreground)" }}>
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-center mt-1.5 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Choisis un mot de passe sécurisé (min. 8 caractères).
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <ShieldCheck size={40} style={{ color: "var(--primary)" }} />
            <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Mot de passe mis à jour !
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Redirection vers ton espace…
            </p>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Vérification du lien de réinitialisation…
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {/* Nouveau mot de passe */}
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                style={{ ...inputStyle, paddingLeft: "2.25rem", paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Confirmation */}
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="new-password"
                className={inputClass}
                style={{ ...inputStyle, paddingLeft: "2.25rem", paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Erreur */}
            {error && (
              <p className="text-xs px-1" style={{ color: "oklch(0.55 0.18 25)" }}>
                {error}
              </p>
            )}

            {/* Bouton */}
            <div className="pt-0.5">
              <div className="w-full">
                <LiquidMetalButton
                  label={loading ? "Mise à jour…" : "Changer le mot de passe"}
                  width={undefined}
                  height={46}
                  fontSize={14}
                  tinted
                  onClick={handleSubmit}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
