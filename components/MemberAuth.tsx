"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { buildAuthRedirect } from "@/lib/auth-redirect"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { Heart, Mail, Lock, User, Eye, EyeOff, X, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react"

type Mode = "menu" | "login" | "signup" | "forgot"

/* ── Composant de polling : vérifie toutes les 3s si l'email est confirmé ── */
function ConfirmationPoller({ email, password, onConfirmed }: { email: string; password: string; onConfirmed: () => void }) {
  useEffect(() => {
    if (!email || !password) return
    const id = setInterval(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data.session) {
        clearInterval(id)
        onConfirmed()
      }
    }, 3000)
    return () => clearInterval(id)
  }, [email, password, onConfirmed])
  return null
}

interface MemberAuthProps {
  onSuccess: () => void
  onClose?: () => void
  initialMode?: Mode
}

export default function MemberAuth({ onSuccess, onClose, initialMode = "menu" }: MemberAuthProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [policiesAccepted, setPoliciesAccepted] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const memberRedirectUrl = buildAuthRedirect("/auth/reset-password")
  const isSignupBlocked = mode === "signup" && !policiesAccepted

  const reset = () => {
    setError("")
    setInfo("")
    setEmail("")
    setPassword("")
    setDisplayName("")
    setPoliciesAccepted(false)
  }

  const goTo = (m: Mode) => {
    reset()
    setMode(m)
  }

  /* ── Login ── */
  const handleLogin = async () => {
    setError("")
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : "Erreur de connexion. Réessaie.")
      return
    }

    const mustChangePassword = !!(data.user?.user_metadata && typeof data.user.user_metadata === "object" && "must_change_password" in data.user.user_metadata && data.user.user_metadata.must_change_password)
    if (mustChangePassword) {
      await supabase.auth.signOut()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: memberRedirectUrl,
      })
      if (resetError) {
        setError("Mot de passe temporaire detecte. Utilise Mot de passe oublie pour le changer.")
      } else {
        setInfo("Mot de passe temporaire detecte. Un lien de changement vient d'etre envoye.")
      }
      return
    }

    onSuccess()
  }

  /* ── Signup ── */
  const handleSignup = async () => {
    setError("")
    if (!displayName.trim()) {
      setError("Un prénom ou pseudo est requis.")
      return
    }
    if (!policiesAccepted) {
      setError("Vous devez accepter la politique avant de créer un compte.")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: memberRedirectUrl,
        data: { display_name: displayName.trim() },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message.includes("already registered")
        ? "Cet email est déjà utilisé. Connecte-toi."
        : "Erreur lors de la création du compte.")
      return
    }

    if (data.user?.id && data.user.email) {
      void fetch("/api/public/account-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          displayName: displayName.trim(),
          kind: "public",
        }),
      })
    }
    setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.")
  }

  /* ── Mot de passe oublié ── */
  const handleForgot = async () => {
    setError("")
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: memberRedirectUrl,
    })
    setLoading(false)
    if (error) {
      setError("Erreur lors de l'envoi. Vérifie l'email.")
      return
    }
    setInfo("Email envoyé ! Consulte ta boîte mail.")
  }

  /* ════ RENDER ════ */

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  const inputStyle = {
    background: "var(--secondary)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  }

  /* ── Menu initial ── */
  if (mode === "menu") {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full transition-opacity hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
            <X size={18} />
          </button>
        )}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
          style={{ background: "var(--secondary)" }}
        >
          <Heart size={24} style={{ color: "var(--primary)" }} />
        </div>
        <h2 className="text-xl font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
          Rejoindre le cercle Milele
        </h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Connecte-toi pour accéder à tes membres, inviter tes proches et garder le lien avec ta famille.
        </p>
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <LiquidMetalButton
            label="Se connecter"
            width={undefined}
            height={44}
            fontSize={14}
            tinted
            onClick={() => goTo("login")}
          />
          </div>
          <button
            onClick={() => goTo("signup")}
            className="w-full h-11 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ color: "var(--primary)", borderColor: "var(--primary)", background: "transparent" }}
          >
            Créer un compte
          </button>
        </div>
      </div>
    )
  }

  /* ── Email confirmation waiting screen ── */
  if (info && mode === "signup") {
    return (
      <div className="w-full max-w-sm mx-auto relative overflow-hidden rounded-2xl border p-7"
        style={{
          background: "color-mix(in srgb, var(--card) 88%, transparent)",
          borderColor: "color-mix(in srgb, var(--primary) 35%, transparent)",
          boxShadow: "0 0 60px color-mix(in srgb, var(--primary) 12%, transparent), 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent)",
        }}
      >
        {/* Orbe arrière-plan haut-gauche */}
        <div className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20"
          style={{ background: "var(--primary)" }} />
        {/* Orbe arrière-plan bas-droite */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-15"
          style={{ background: "var(--primary)" }} />

        {/* Polling auto : détecte la confirmation même depuis un autre appareil */}
        <ConfirmationPoller email={email} password={password} onConfirmed={onSuccess} />

        {/* Bouton fermer */}
        {onClose && (
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}>
            <X size={16} />
          </button>
        )}

        {/* Icône animée */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Halo pulsant externe */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 scale-150"
              style={{ background: "var(--primary)" }} />
            {/* Halo pulsant intermédiaire */}
            <div className="absolute inset-0 rounded-full animate-pulse opacity-30 scale-125"
              style={{ background: "color-mix(in srgb, var(--primary) 40%, transparent)" }} />
            {/* Cercle principal */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-2"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, var(--card))",
                borderColor: "color-mix(in srgb, var(--primary) 45%, transparent)",
                boxShadow: "0 0 30px color-mix(in srgb, var(--primary) 25%, transparent)",
              }}
            >
              <Mail size={34} style={{ color: "var(--primary)" }} />
              {/* Badge check */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--card)",
                }}
              >
                <CheckCircle2 size={18} style={{ color: "var(--primary)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-center mb-2 tracking-tight"
          style={{ color: "var(--foreground)" }}>
          Vérifie ta boîte mail
        </h2>

        {/* Sous-titre */}
        <p className="text-sm text-center leading-relaxed mb-1"
          style={{ color: "var(--muted-foreground)" }}>
          Un lien de confirmation a été envoyé à
        </p>
        <p className="text-sm font-semibold text-center mb-5 truncate"
          style={{ color: "var(--primary)" }}>
          {email}
        </p>

        {/* Bloc info */}
        <div className="rounded-xl px-4 py-3 mb-6 text-xs text-center leading-relaxed border"
          style={{
            background: "color-mix(in srgb, var(--primary) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
            color: "var(--muted-foreground)",
          }}
        >
          Clique sur le lien dans l'email pour activer ton compte.<br />
          <span className="opacity-70">Pense à vérifier tes spams si tu ne le vois pas.</span>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[11px] px-1" style={{ color: "var(--muted-foreground)" }}>Déjà confirmé ?</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Bouton Se connecter */}
        <div className="w-full">
          <LiquidMetalButton
          label="Se connecter"
          width={undefined}
          height={46}
          fontSize={14}
          tinted
          onClick={() => goTo("login")}
        />
        </div>
      </div>
    )
  }

  /* ── Login / Signup / Forgot ── */
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--card) 86%, transparent)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => goTo("menu")} className="p-1.5 rounded-full hover:opacity-70 transition-opacity" style={{ color: "var(--muted-foreground)" }}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          {mode === "login" ? "Se connecter" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
        </h2>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1.5 rounded-full hover:opacity-70 transition-opacity" style={{ color: "var(--muted-foreground)" }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        {/* Prénom/pseudo (signup seulement) */}
        {mode === "signup" && (
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="Prénom ou pseudo"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, paddingLeft: "2.25rem" }}
            />
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && mode === "forgot" && handleForgot()}
            className={inputClass}
            style={{ ...inputStyle, paddingLeft: "2.25rem" }}
          />
        </div>

        {/* Mot de passe (pas pour forgot) */}
        {mode !== "forgot" && (
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (mode === "login") handleLogin()
                  else if (mode === "signup") handleSignup()
                }
              }}
              className={inputClass}
              style={{ ...inputStyle, paddingLeft: "2.25rem", paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
              style={{ color: "var(--muted-foreground)" }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        )}

        {/* Case politiques: sous mot de passe, au-dessus du bouton créer */}
        {mode === "signup" && (
          <label className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 border" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--secondary) 74%, transparent)" }}>
            <input
              type="checkbox"
              checked={policiesAccepted}
              onChange={(e) => setPoliciesAccepted(e.target.checked)}
              className="mt-0.5"
              aria-label="Accepter la politique"
            />
            <span className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              J'ai lu et j'accepte la{" "}
              <Link href="/politique" className="underline font-semibold hover:opacity-80" style={{ color: "var(--primary)" }}>
                politique de confidentialité
              </Link>
              {" "}avant la création du compte.
            </span>
          </label>
        )}

        {/* Erreur / Info */}
        {error && (
          <p className="text-xs px-1" style={{ color: "oklch(0.55 0.18 25)" }}>{error}</p>
        )}
        {info && mode !== "signup" && (
          <p className="text-xs px-1" style={{ color: "var(--primary)" }}>{info}</p>
        )}

        {/* Bouton principal */}
        {!info && (
          <div className="pt-0.5">
            {mode === "signup" ? (
              <LiquidMetalButton
                label={loading ? "Création..." : "Créer"}
                width={336}
                height={48}
                fontSize={15}
                tinted
                leftIcon={<Sparkles size={14} />}
                onClick={handleSignup}
                disabled={loading || isSignupBlocked}
              />
            ) : (
              <div className="w-full">
                <LiquidMetalButton
                label={loading
                  ? "…"
                  : mode === "login" ? "Se connecter"
                  : "Envoyer le lien"}
                width={undefined}
                height={46}
                fontSize={14}
                tinted
                onClick={mode === "login" ? handleLogin : handleForgot}
                disabled={loading}
              />
              </div>
            )}
            {mode === "signup" && isSignupBlocked && (
              <p className="text-[11px] mt-1.5 px-1" style={{ color: "var(--muted-foreground)" }}>
                Cochez la politique pour activer « Créer mon compte ».
              </p>
            )}
          </div>
        )}

        {/* Liens secondaires */}
        {mode === "login" && (
          <button
            onClick={() => goTo("forgot")}
            className="text-xs text-center mt-1 hover:opacity-70 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}
          >
            Mot de passe oublié ?
          </button>
        )}

        {mode === "signup" && (
          <p className="text-xs text-center mt-1" style={{ color: "var(--muted-foreground)" }}>
            Déjà un compte ?{" "}
            <button onClick={() => goTo("login")} className="underline font-medium hover:opacity-70" style={{ color: "var(--primary)" }}>
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
