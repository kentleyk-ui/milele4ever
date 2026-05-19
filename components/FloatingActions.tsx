"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useLocale } from "@/lib/locale-context"

const MalaikaChat = dynamic(() => import("./MalaikaChat").then((m) => m.MalaikaChat), { ssr: false })
const FeedbackModal = dynamic(() => import("./FeedbackModal").then((m) => m.FeedbackModal), { ssr: false })
const LiquidMetalButton = dynamic(() => import("./liquid-metal-button").then((m) => m.LiquidMetalButton), { ssr: false })

/* ═══ Icône Chatbot — ange gardien ═══ */
function ChatbotIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Auréole */}
      <ellipse cx="12" cy="5.5" rx="3" ry="1" strokeWidth="1" opacity="0.6" />
      {/* Tête */}
      <circle cx="12" cy="8.2" r="2" strokeWidth="1.1" />
      {/* Yeux – petits points sereins */}
      <circle cx="11.2" cy="8" r="0.35" fill="currentColor" stroke="none" />
      <circle cx="12.8" cy="8" r="0.35" fill="currentColor" stroke="none" />
      {/* Aile gauche — plumes étagées */}
      <path d="M10 11.5C7.5 10 4 9.5 3 11.5c1.5 0.3 3.5 1.2 5 2.5" strokeWidth="1" />
      <path d="M8 11c-1.5-0.3-3.2 0.2-3.8 1.2" strokeWidth="0.7" opacity="0.4" />
      <path d="M7.2 12.2c-1.2 0-2.3 0.5-2.7 1.2" strokeWidth="0.6" opacity="0.3" />
      {/* Aile droite — plumes étagées */}
      <path d="M14 11.5c2.5-1.5 6-2 7 0c-1.5 0.3-3.5 1.2-5 2.5" strokeWidth="1" />
      <path d="M16 11c1.5-0.3 3.2 0.2 3.8 1.2" strokeWidth="0.7" opacity="0.4" />
      <path d="M16.8 12.2c1.2 0 2.3 0.5 2.7 1.2" strokeWidth="0.6" opacity="0.3" />
      {/* Corps / robe fluide */}
      <path d="M10 10.5c0 0-1.5 5-2 8.5h8c-0.5-3.5-2-8.5-2-8.5" strokeWidth="1.1" />
      {/* Plis de la robe */}
      <path d="M10.5 14c0.5 1.5 0.8 3.5 0.5 5" strokeWidth="0.5" opacity="0.3" />
      <path d="M13.5 14c-0.5 1.5-0.8 3.5-0.5 5" strokeWidth="0.5" opacity="0.3" />
      {/* Lueur subtile sous l'ange */}
      <path d="M9 20c1-0.5 2-0.7 3-0.7s2 0.2 3 0.7" strokeWidth="0.5" opacity="0.2" />
    </svg>
  )
}

/* ═══ Icône Suggestions — enveloppe ═══ */
function SuggestionsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
      <path d="M4 17l6-4" opacity="0.55" />
      <path d="M20 17l-6-4" opacity="0.55" />
    </svg>
  )
}

function FloatingButton({
  icon,
  label,
  size,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  size: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(h => !h)}
    >
      <span
        className={`text-[10px] sm:text-[11px] font-medium tracking-wide px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
          hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        }`}
        style={{
          background: 'color-mix(in srgb, var(--card) 85%, transparent)',
          borderColor: 'color-mix(in srgb, var(--primary) 15%, var(--border))',
          color: 'var(--muted-foreground)',
          boxShadow: '0 4px 16px oklch(0.10 0.03 150 / 0.12)',
          willChange: 'opacity, transform',
        }}
        tabIndex={0}
        aria-label={label}
      >
        {label}
      </span>
      <div
        onClick={onClick}
        className="cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        tabIndex={0}
        aria-label={label}
        role="button"
      >
        <LiquidMetalButton
          viewMode="icon"
          width={Math.max(size,44)}
          height={Math.max(size,44)}
          tinted
          iconNode={icon}
          label={label}
        />
      </div>
    </div>
  );
}

export function FloatingActions() {
  const pathname = usePathname()
  const { t } = useLocale()
  const [malaikaOpen, setMalaikaOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  // Widget reserve au cote public
  if (pathname?.startsWith("/staff") || pathname?.startsWith("/admin") || pathname?.startsWith("/preview-staff")) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5 sm:gap-3">
        {/* Malaika — bouton ange (plus gros) */}
        <FloatingButton
          icon={<ChatbotIcon />}
          label={t('floating.malaika')}
          size={42}
          onClick={() => setMalaikaOpen(!malaikaOpen)}
        />
        {/* Suggestions en bas */}
        <FloatingButton
          icon={<SuggestionsIcon />}
          label={t('floating.suggestions')}
          size={38}
          onClick={() => setFeedbackOpen(true)}
        />
      </div>

      {/* Chat Malaika */}
      <MalaikaChat mode="public" open={malaikaOpen} onClose={() => setMalaikaOpen(false)} />

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
