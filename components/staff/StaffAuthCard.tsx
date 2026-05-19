"use client"           

import { useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { StaffButton } from "@/components/ui/staff-button"

export function StaffAuthCard({
  onSubmit,
  loading,
}: {
  onSubmit: (email: string, password: string) => Promise<void>
  loading: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border flex flex-col gap-8 items-center justify-center mx-auto panel-surface-strong"
      style={{
        boxShadow: "0 25px 50px -12px color-mix(in srgb, var(--surface-tint-strong) 45%, transparent), inset 0 1px 1px color-mix(in srgb, white 12%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-2xl p-4"
          style={{
            background: "color-mix(in srgb, var(--primary) 14%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))",
            boxShadow: "0 0 15px color-mix(in srgb, var(--primary) 24%, transparent)",
          }}>
          <Lock size={32} style={{ color: "var(--primary)" }} />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Espace Staff</h1>
          <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
            Identification requise pour accéder au Hub
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-5 w-full"
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit(email.trim(), password)
        }}
      >
        <div className="space-y-4">
          <div className="relative group">
             <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="w-full px-5 py-4 rounded-2xl outline-none transition-all"
              style={{
                background: "color-mix(in srgb, var(--card) 88%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                color: "var(--foreground)",
              }}
              autoFocus
              required
            />
          </div>
          <div className="relative group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-5 py-4 rounded-2xl outline-none transition-all"
              style={{
                background: "color-mix(in srgb, var(--card) 88%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                color: "var(--foreground)",
              }}
              required
            />
          </div>
        </div>

        <StaffButton type="submit" variant="primary" className="mt-2 h-14" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Se connecter"}
        </StaffButton>
      </form>

      <div className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
        Accès strictement réservé. Les tentatives de connexion sont journalisées.
      </div>
    </div>
  )
}
