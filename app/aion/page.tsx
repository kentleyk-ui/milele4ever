"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { TrendingUp, Users, Clock, ChevronRight, Sparkles, Brain, ShieldCheck, User } from "lucide-react"
import { useAionDashboard } from "@/hooks/useAionDashboard"
import { supabase } from "@/lib/supabaseClient"
import { timeAgo } from "@/lib/aion-dates"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import type { AionModule } from "@/types/aion"

export default function AionDashboardPage() {
  const { modules, stats, loading } = useAionDashboard()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserName(user.email.split("@")[0])
    })
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Bonjour"
    if (h < 18) return "Bonne après-midi"
    return "Bonsoir"
  }

  const intelligence = useMemo(() => {
    const hasCircle = stats.circleMembers > 0
    const hasRecentActivity = stats.recentActivity.length > 0
    const lowCoverageModules = modules.filter((m) => m.count === 0).slice(0, 3)
    const presenceScore = Math.min(
      100,
      Math.round((stats.completionPct * 0.55) + (Math.min(stats.totalContent, 24) * 1.25) + (Math.min(stats.circleMembers, 8) * 4))
    )

    const suggestions: string[] = []
    if (!hasCircle) suggestions.push("Invitez au moins 1 personne de confiance pour sécuriser la transmission.")
    if (stats.capsulesPending === 0) suggestions.push("Créez une capsule temporelle: c'est un geste fort pour l'héritage émotionnel.")
    if (lowCoverageModules.length > 0) suggestions.push(`Complétez en priorité: ${lowCoverageModules.map((m) => m.label).join(", ")}.`)
    if (!hasRecentActivity) suggestions.push("Ajoutez un premier souvenir pour déclencher votre dynamique Aïon.")

    const tone = presenceScore >= 75
      ? "Votre héritage est déjà bien structuré. Continuons avec finesse."
      : "Votre héritage prend forme. Je vous guide étape par étape."

    return { presenceScore, suggestions: suggestions.slice(0, 3), tone, lowCoverageModules }
  }, [modules, stats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "var(--primary)" }}
        />
      </div>
    )
  }

  return (
    <div className="relative px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      {/* Orbe décoratif subtil */}
      <div className="orb orb-primary" style={{ width: 350, height: 350, top: "-5%", right: "-10%", opacity: 0.2, pointerEvents: "none" }} />

      {/* Salutation */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full animate-halo-pulse" style={{ background: "var(--primary)" }} />
          <p className="text-xs tracking-widest uppercase font-bold" style={{ color: "var(--primary)" }}>
            {greeting()}
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          {userName ? <>{userName},</> : ""}{" "}
          <span className="gradient-text">votre Aïon</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Préservez votre héritage, un chapitre à la fois.
        </p>
      </div>

      {/* Présence Aion */}
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-3 mb-8">
        <div className="card-glow relative rounded-2xl p-5 overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 16%, var(--border))" }}>
          <div className="absolute -top-20 -right-16 w-52 h-52 rounded-full orb orb-primary" style={{ opacity: 0.18 }} />
          <div className="flex items-start gap-4 relative">
            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--primary) 14%, var(--secondary))" }}>
              <AionFace />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "var(--primary)" }}>
                Présence Aïon
              </p>
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Je suis là pour construire votre héritage avec vous.
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                {intelligence.tone}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--primary) 10%, var(--border))" }}>
            <div className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: "var(--primary)" }}>
              <Brain size={14} />
              Suggestions intelligentes
            </div>
            {intelligence.suggestions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {intelligence.suggestions.map((s, i) => {
                  const links = ["/aion/cercle", "/aion/capsules", "/aion/souvenirs", "/aion/volontes"]
                  return (
                    <Link key={i} href={links[i] ?? "/aion"}
                      className="flex items-start gap-2.5 p-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: "color-mix(in srgb, var(--primary) 6%, var(--secondary))", border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" }}>
                      <span className="text-base flex-shrink-0 mt-0.5">✦</span>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{s}</p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "color-mix(in srgb, #10B981 8%, var(--secondary))", border: "1px solid color-mix(in srgb, #10B981 20%, var(--border))" }}>
                <span className="text-base">🌟</span>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Tout est bien lancé. Continuez avec une mise à jour régulière de vos contenus.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card-glow rounded-2xl p-5 flex flex-col items-center justify-center gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold self-start" style={{ color: "var(--primary)" }}>
            <ShieldCheck size={14} />
            Indice d&apos;héritage
          </div>
          {/* Anneau SVG */}
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" style={{ stroke: "var(--secondary)" }} />
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                strokeDasharray={`${intelligence.presenceScore} ${100 - intelligence.presenceScore}`}
                strokeLinecap="round"
                style={{ stroke: "var(--primary)", transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black gradient-text">{intelligence.presenceScore}</span>
              <span className="text-[9px] font-medium" style={{ color: "var(--muted-foreground)" }}>/ 100</span>
            </div>
          </div>
          {/* Niveau */}
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
              {intelligence.presenceScore >= 80 ? "Gardien" : intelligence.presenceScore >= 55 ? "Témoin" : intelligence.presenceScore >= 30 ? "En marche" : "Débutant"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Complétion & transmissibilité
            </p>
          </div>
        </div>
      </div>

      {/* Widget Profil */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl card-glow"
        style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, var(--secondary))", color: "var(--primary)" }}>
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--primary)" }}>
                Profil
              </p>
              <p className="text-sm truncate" style={{ color: "var(--muted-foreground)" }}>
                Gérez votre profil public et vos publications.
              </p>
            </div>
          </div>
          <Link
            href="/espace/profil"
            className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{
              color: "var(--primary)",
              background: "color-mix(in srgb, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary) 24%, transparent)",
            }}
          >
            Ouvrir profil
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<TrendingUp size={18} />} label="Contenus" value={stats.totalContent} color="primary" />
        <StatCard icon={<Users size={18} />} label="Cercle" value={stats.circleMembers} color="blue" />
        <StatCard icon={<Clock size={18} />} label="Capsules" value={stats.capsulesPending} color="amber" />
        <div
          className="p-4 rounded-2xl flex flex-col justify-between"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>
            Complétion
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${stats.completionPct}%`, background: "var(--primary)" }}
              />
            </div>
            <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {stats.completionPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Modules grid */}
      <h2 className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: "var(--muted-foreground)" }}>
        Vos modules
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {modules.map((mod, i) => (
          <ModuleCard key={mod.key} module={mod} index={i} />
        ))}
      </div>

      {intelligence.lowCoverageModules.length > 0 && (
        <div className="p-5 rounded-2xl mb-6 card-glow"
          style={{ background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Sparkles size={16} style={{ color: "var(--primary)" }} />
            Prochaines meilleures actions
          </h3>
          <div className="flex flex-col gap-2">
            {intelligence.lowCoverageModules.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors"
                style={{ background: "color-mix(in srgb, var(--primary) 4%, var(--secondary))", color: "var(--foreground)" }}
              >
                <span className="text-sm">Compléter: {m.label}</span>
                <ChevronRight size={14} style={{ color: "var(--primary)" }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Activité récente */}
      {stats.recentActivity.length > 0 && (
        <div className="p-5 rounded-2xl mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Activité récente
          </h3>
          <div className="flex flex-col gap-3">
            {stats.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2">
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{a.action}</p>
                <span className="text-[11px] flex-shrink-0" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                  {timeAgo(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Cercle */}
      <div
        className="relative p-6 rounded-2xl text-center overflow-hidden animate-border-glow"
        style={{
          background: "color-mix(in srgb, var(--primary) 6%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)",
        }}
      >
        <div className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--primary) 30%, transparent), transparent 70%)" }} />
        <Users size={28} className="mx-auto mb-3 relative" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold mb-1 relative" style={{ color: "var(--foreground)" }}>
          Constituez votre Cercle de Confiance
        </h3>
        <p className="text-xs mb-4 max-w-xs mx-auto" style={{ color: "var(--muted-foreground)" }}>
          Invitez vos proches et définissez ce qu&apos;ils pourront découvrir.
        </p>
        <div className="flex justify-center">
          <Link href="/aion/cercle">
            <LiquidMetalButton label="Gérer mon cercle" width={200} height={44} fontSize={13} tinted />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Composants internes ─────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  const colorMap: Record<string, string> = {
    primary: "var(--primary)", blue: "#3B82F6", amber: "#F59E0B", pink: "#EC4899",
  }
  const c = colorMap[color] ?? "var(--primary)"
  return (
    <div className="stat-card card-glow relative p-4 rounded-2xl flex flex-col gap-2 overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Accent en haut */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
      <div style={{ color: c }}>{icon}</div>
      <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</span>
      <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
    </div>
  )
}

function ModuleCard({ module: mod }: { module: AionModule; index: number }) {
  return (
    <Link
      href={mod.href}
      className="group relative p-5 rounded-2xl transition-all duration-300 active:scale-[0.97] touch-manipulation card-glow overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 100 }}
    >
      {/* Accent de couleur en fond subtil au hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 50%, color-mix(in srgb, ${mod.color} 8%, transparent), transparent 70%)` }} />
      {/* Barre d'accent haut */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${mod.color}, transparent)` }} />

      <div className="flex items-start justify-between gap-2 relative">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `color-mix(in srgb, ${mod.color} 15%, var(--card))` }}
        >
          {mod.icon}
        </div>
        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all mt-1" style={{ color: mod.color }} />
      </div>
      <div className="mt-3 relative">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{mod.label}</h3>
          {mod.count > 0 && (
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: `color-mix(in srgb, ${mod.color} 18%, transparent)`, color: mod.color }}
            >
              {mod.count}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{mod.description}</p>
      </div>
    </Link>
  )
}

function AionFace() {
  return (
    <svg viewBox="0 0 80 80" width={42} height={42} fill="none" aria-hidden>
      <circle cx="40" cy="40" r="38" stroke="color-mix(in srgb, var(--primary) 35%, transparent)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="30" fill="color-mix(in srgb, var(--primary) 8%, transparent)" />
      <ellipse cx="30" cy="36" rx="3.2" ry="4.2" fill="var(--primary)" />
      <ellipse cx="50" cy="36" rx="3.2" ry="4.2" fill="var(--primary)" />
      <path d="M27 50c3.2 4.2 7.8 6.3 13 6.3s9.8-2.1 13-6.3" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M21 28c5-4.7 11-7.3 19-7.3s14 2.6 19 7.3" stroke="color-mix(in srgb, var(--primary) 55%, transparent)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
