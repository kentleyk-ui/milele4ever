"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"

export function Footer() {
  const { t } = useLocale()

  return (
    <footer
      className="relative py-10 sm:py-16 px-4 sm:px-6 md:px-8 border-t overflow-hidden"
      style={{
        background: "color-mix(in srgb, var(--card) 60%, var(--background))",
        borderColor: "color-mix(in srgb, var(--border) 50%, transparent)",
      }}>

      {/* Orbe subtil */}
      <div className="orb orb-primary" style={{ width: 300, height: 300, bottom: "-50%", left: "50%", transform: "translateX(-50%)", opacity: 0.15 }} />

      {/* Bandeau défilant (marque de confiance) */}
      <div className="relative overflow-hidden mb-10 sm:mb-14 border-y py-3"
        style={{ borderColor: "color-mix(in srgb, var(--primary) 10%, var(--border))" }}>
        <div className="flex animate-marquee whitespace-nowrap gap-12 select-none">
          {["Dignité", "Éternité", "Mémoire", "Amour", "Transmission", "Héritage", "Espoir", "Pour Toujours",
            "Dignité", "Éternité", "Mémoire", "Amour", "Transmission", "Héritage", "Espoir", "Pour Toujours"].map((word, i) => (
            <span key={i} className="text-[11px] font-bold tracking-[0.25em] uppercase"
              style={{ color: i % 4 === 0 ? "var(--primary)" : "var(--muted-foreground)", opacity: i % 4 === 0 ? 0.9 : 0.35 }}>
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl relative">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Logo avec halo */}
          <Link href="/"
            className="group flex items-center gap-3 transition-all hover:scale-105 min-h-[44px] focus:outline-none"
            aria-label="Accueil Milele">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                style={{ background: "var(--primary)", transform: "scale(1.5)" }} />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary)" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-widest uppercase" style={{color: 'var(--foreground)'}}>Milele</span>
          </Link>

          {/* Tagline italic */}
          <p className="text-[13px] sm:text-sm leading-relaxed max-w-sm italic"
            style={{color: 'var(--muted-foreground)', fontFamily: "Georgia, serif"}}>
            {t('footer.tagline')}
          </p>

          {/* Séparateur ornemental */}
          <div className="flex items-center gap-3" style={{ opacity: 0.4 }}>
            <div className="h-px w-10 rounded-full" style={{ background: "var(--primary)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--primary)" }} />
            <div className="h-px w-10 rounded-full" style={{ background: "var(--primary)" }} />
          </div>

          {/* Liens navigation */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { href: "/a-propos", label: "À propos" },
              { href: "/services", label: "Services" },
              { href: "/aion", label: "Aïon" },
              { href: "/politique", label: "Confidentialité" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="text-xs font-medium tracking-wide underline-animated transition-opacity hover:opacity-80 min-h-[44px] inline-flex items-center"
                style={{ color: "var(--muted-foreground)" }}>
                {label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[11px] sm:text-xs tracking-wide mt-2"
            style={{color: 'var(--muted-foreground)', opacity: 0.5}}>
            Product Owner · Kent Ley — CEO · © 2026 Milele. {t('footer.rights')}
          </p>

          {/* Phrase signature */}
          <p className="text-[11px] italic mt-1" style={{ color: "var(--primary)", opacity: 0.6 }}>
            Kwa sababu ime stahili — Parce qu&apos;il le mérite.
          </p>
        </div>
      </div>
    </footer>
  )
}
