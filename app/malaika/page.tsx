"use client"

import dynamic from "next/dynamic"
import { Sparkles, Brain, Clock, Lock, Globe, Heart } from "lucide-react"

const MalaikaChat = dynamic(() => import("@/components/MalaikaChat").then(m => ({ default: m.MalaikaChat })), { ssr: false })

const FEATURES = [
  { icon: Brain, label: "Mémoire persistante", desc: "Malaika se souvient de vos échanges précédents, même après fermeture.", color: "#8B5CF6" },
  { icon: Clock, label: "Disponible 24h/24", desc: "Posez vos questions à tout moment, sans attente.", color: "#3B82F6" },
  { icon: Lock, label: "Confidentiel", desc: "Vos conversations restent privées, jamais partagées.", color: "#10B981" },
  { icon: Globe, label: "Multilingue", desc: "Parlez en français, anglais, lingala… Malaika comprend.", color: "#F59E0B" },
  { icon: Heart, label: "Empathique", desc: "Formée pour répondre avec douceur dans des moments difficiles.", color: "#EC4899" },
  { icon: Sparkles, label: "Guidée par Milele", desc: "Connaissance approfondie des fonctionnalités de la plateforme.", color: "#06B6D4" },
]

export default function PublicMalaikaPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-16 pb-12 text-center"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, #10B981 12%, var(--background)), color-mix(in srgb, #8B5CF6 8%, var(--background)))" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 30% 20%, color-mix(in srgb,#10B981 18%,transparent), transparent 55%), radial-gradient(circle at 75% 80%, color-mix(in srgb,#8B5CF6 14%,transparent), transparent 55%)",
        }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl shadow-2xl"
            style={{ background: "linear-gradient(135deg, #10B981, #8B5CF6)", boxShadow: "0 0 40px color-mix(in srgb,#10B981 40%,transparent)" }}>
            💚
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{
            background: "linear-gradient(90deg, #10B981, #8B5CF6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Malaika
          </h1>
          <p className="text-lg font-medium mb-2" style={{ color: "var(--foreground)" }}>Ton ange gardien numérique</p>
          <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Malaika est l'assistante IA de Milele. Elle t'accompagne dans la création de ton profil, tes publications, et tes démarches — avec douceur et mémoire.
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-center mb-6" style={{ color: "var(--foreground)" }}>
          Ce que Malaika peut faire pour toi
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
          {FEATURES.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="p-4 rounded-2xl flex flex-col gap-2"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 15%, var(--card))` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="rounded-3xl overflow-hidden" style={{
          border: "1px solid color-mix(in srgb, #10B981 30%, var(--border))",
          boxShadow: "0 0 40px color-mix(in srgb,#10B981 8%,transparent)",
        }}>
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ background: "color-mix(in srgb, #10B981 10%, var(--card))", borderBottom: "1px solid color-mix(in srgb, #10B981 20%, var(--border))" }}>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Malaika est en ligne — parle lui maintenant</span>
          </div>
          <div style={{ height: 480 }}>
            <MalaikaChat mode="public" />
          </div>
        </div>

        {/* CTA inscription */}
        <div className="mt-10 text-center p-6 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
            Malaika se souvient de toi dès que tu crées un compte 💚
          </p>
          <a href="/inscription"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #10B981, #8B5CF6)", color: "#fff" }}>
            <Sparkles size={16} />
            Rejoindre Milele gratuitement
          </a>
        </div>
      </div>
    </div>
  )
}

