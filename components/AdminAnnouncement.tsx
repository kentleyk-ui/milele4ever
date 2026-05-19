"use client"

import { useState, useEffect } from "react"
import { EyeOff } from "lucide-react"
import { LiquidMetalButton } from "./DynamicLiquidMetalButton"

const SHOW_DELAY = 8_000

export function AdminAnnouncement() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY)
    return () => clearTimeout(timer)
  }, [])

  const handleHide = () => {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleHide() }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-in fade-in duration-500"
        style={{
          background: "oklch(0.06 0.02 200 / 0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          willChange: 'opacity',
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md animate-in zoom-in-95 fade-in slide-in-from-bottom-3 duration-500"
        style={{
          background: "linear-gradient(180deg, #e8f0ea 0%, #c8d8cc 100% / 60%)",
          borderRadius: '32px',
          border: '1.5px solid oklch(0.42 0.10 152 / 0.22)',
          boxShadow: '0px 8px 40px 0px oklch(0.42 0.10 152 / 0.28), 0 16px 64px 0px oklch(0.10 0.03 150 / 0.28), 0 0 0 2.5px oklch(0.42 0.10 152 / 0.13)',
          backdropFilter: 'blur(56px) saturate(2.4)',
          WebkitBackdropFilter: 'blur(56px) saturate(2.4)',
          padding: '0',
          willChange: 'transform, opacity',
        }}
      >
        {/* Accent top */}
        <div
          style={{
            height: "2px",
            borderRadius: "1.5rem 1.5rem 0 0",
            background: "linear-gradient(90deg, transparent 5%, var(--primary) 50%, transparent 95%)",
            opacity: 0.7,
          }}
        />

        {/* Contenu */}
        <div className="px-6 sm:px-8 pt-7 pb-6 text-center">
          {/* Titre */}
          <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "var(--primary)", opacity: 0.8 }}>
            ✨ Message d&apos;accueil
          </p>

          <h2
            className="text-lg sm:text-xl font-semibold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            Admin
          </h2>

          <div
            className="w-10 h-px mx-auto my-4"
            style={{ background: "color-mix(in srgb, var(--primary) 40%, transparent)" }}
          />

          {/* Message */}
          <div className="space-y-3 text-base leading-relaxed font-semibold" style={{ color: "var(--foreground)", textShadow: "0 2px 8px oklch(0.10 0.03 150 / 0.18)" }}>
            <p className="italic">
              Bienvenue dans ma création.
            </p>
            <p>
              Nous entamons ensemble la phase de test de la première étape du voyage vers l&apos;<strong>Aeternum</strong>.
            </p>
            <p className="mt-4">
              Votre regard compte.
            </p>
            <p>
              👉 Merci de rapporter toute suggestion ou erreur dans la section <strong>&laquo;&nbsp;Suggestions&nbsp;&raquo;</strong> au bas de la page.
            </p>
            <p className="mt-4 font-bold text-primary" style={{textShadow: "0 2px 8px oklch(0.42 0.10 152 / 0.18)"}}>
              🐾 Surtout, n&apos;hésitez pas à aller visiter la rubrique de nos petits amis, les animaux !
            </p>
          </div>

          {/* Signature */}
          <p
            className="mt-5 text-sm sm:text-base font-semibold italic"
            style={{ color: "var(--foreground)", opacity: 0.9 }}
          >
            — Kent Ley
          </p>

          {/* Séparateur */}
          <div
            className="w-16 h-px mx-auto my-5"
            style={{ background: "color-mix(in srgb, var(--border) 60%, transparent)" }}
          />

          {/* Bouton Hide */}
          <div className="flex justify-center mt-1">
            <LiquidMetalButton
              label="Masquer"
              onClick={handleHide}
              viewMode="text"
              width={140}
              height={44}
              fontSize={18}
              tinted
              iconNode={<EyeOff size={20} />}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
