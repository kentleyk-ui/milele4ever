"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import { useLocale } from "@/lib/locale-context"

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

export default function AProposPage() {
  const { t } = useLocale()
  const { ref: heroRef, visible: heroVisible } = useInView(0.1)
  const { ref: cardsRef, visible: cardsVisible } = useInView(0.1)
  const { ref: closingRef, visible: closingVisible } = useInView(0.1)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Orbes décoratifs */}
      <div className="orb orb-primary animate-float-slow" style={{ width: 500, height: 500, top: "-10%", right: "-15%", opacity: 0.35 }} />
      <div className="orb orb-accent animate-float-medium" style={{ width: 300, height: 300, bottom: "20%", left: "-10%", opacity: 0.25 }} />

      {/* ── Nav glassmorphism ── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 md:px-10 md:py-5"
        style={{
          background: "color-mix(in srgb, var(--background) 75%, transparent)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <ArrowLeft size={18} style={{ color: "var(--muted-foreground)" }} className="transition-transform group-hover:-translate-x-1" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-[14px] sm:text-[15px] font-bold tracking-wide" style={{ color: "var(--foreground)" }}>Milele</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/espace" className="hidden sm:block text-[12px] sm:text-[13px] font-medium tracking-wide transition-colors hover:opacity-70 underline-animated" style={{ color: "var(--muted-foreground)" }}>
            {t("about.nav.login")}
          </Link>
        </div>
      </nav>

      {/* ── Contenu ── */}
      <main className="py-12 sm:py-20 md:py-28 px-4 sm:px-6 md:px-8 relative">
        <div className="mx-auto max-w-3xl">
          {/* Titre avec animation d'entrée */}
          <div ref={heroRef} className="text-center mb-10 sm:mb-14"
            style={{ transition: "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(32px)" }}>
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-[2px] w-10 rounded-full" style={{ background: "var(--primary)", opacity: 0.5 }} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "var(--primary)" }}>{t("about.badge")}</span>
              <div className="h-[2px] w-10 rounded-full" style={{ background: "var(--primary)", opacity: 0.5 }} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: "var(--foreground)" }}>
              {t("about.h1")}
            </h1>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 gradient-text"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
              {t("about.h1b")}
            </p>
          </div>

          {/* Texte principal */}
          <div className="space-y-6 sm:space-y-8 mb-14 sm:mb-20">
            {[
              <p key="1" className="text-sm sm:text-base leading-relaxed text-center" style={{ color: "var(--muted-foreground)" }}>
                <span className="font-semibold" style={{ color: "var(--primary)" }}>Milele</span>{" "}
                <span dangerouslySetInnerHTML={{ __html: t("about.p1") }} />
              </p>,
              <p key="2" className="text-sm sm:text-base leading-relaxed text-center font-semibold" style={{ color: "var(--foreground)" }}>
                {t("about.p2")}
              </p>,
              <div key="3" className="text-sm sm:text-base leading-relaxed text-center" style={{ color: "var(--muted-foreground)" }}>
                <p>{t("about.p3a")}</p>
                <p>{t("about.p3b")}</p>
              </div>,
              <p key="4" className="text-base sm:text-lg leading-relaxed text-center font-semibold" style={{ color: "var(--foreground)" }}>
                {t("about.p4")}
              </p>,
              <div key="5" className="text-sm sm:text-base leading-relaxed text-center" style={{ color: "var(--muted-foreground)" }}>
                <p>{t("about.p5a")}</p>
                <p>{t("about.p5b")}</p>
              </div>,
              <div key="6" className="relative py-4 sm:py-6 border-l-2 pl-5 sm:pl-8 mx-auto max-w-xl rounded-r-xl"
                style={{ borderColor: "var(--primary)", background: "color-mix(in srgb, var(--primary) 4%, transparent)" }}>
                <div className="absolute -left-1 top-4 w-2 h-2 rounded-full animate-halo-pulse" style={{ background: "var(--primary)" }} />
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--foreground)" }}
                  dangerouslySetInnerHTML={{ __html: t("about.quote1").replace("Milele", "<span class='font-bold gradient-text'>Milele</span>") }} />
                <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {t("about.quote2")}
                </p>
                <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {t("about.quote3")}
                </p>
              </div>,
            ].map((el, i) => (
              <div key={i} style={{ transition: `opacity 0.7s ${i * 0.1 + 0.2}s, transform 0.7s ${i * 0.1 + 0.2}s`, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(16px)" }}>
                {el}
              </div>
            ))}
          </div>

          {/* Cards */}
          <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-14 sm:mb-20">
            {getFeatures(t).map((f, i) => (
              <div
                key={f.key}
                className="card-glow rounded-xl sm:rounded-2xl p-5 sm:p-7 text-center"
                style={{
                  background: "color-mix(in srgb, var(--card) 80%, transparent)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))",
                  transition: `opacity 0.7s ${i * 0.15 + 0.2}s, transform 0.7s ${i * 0.15 + 0.2}s`,
                  opacity: cardsVisible ? 1 : 0,
                  transform: cardsVisible ? "none" : "translateY(24px)",
                }}
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl halo-pulse"
                  style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: "var(--foreground)" }}>
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* Closing */}
          <div ref={closingRef} className="text-center space-y-4"
            style={{ transition: "opacity 0.9s, transform 0.9s", opacity: closingVisible ? 1 : 0, transform: closingVisible ? "none" : "translateY(24px)" }}>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {t("about.closing1a")}<br />
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{t("about.closing1b")}</span>
            </p>
            <p className="text-sm sm:text-base" style={{ color: "var(--muted-foreground)" }}>
              {t("about.closing2")}
            </p>
            <p className="text-base sm:text-lg font-bold mt-6 gradient-text"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
              {t("about.closing3")}
            </p>
            <div className="mt-8 flex justify-center">
              <LiquidMetalButton
                label={t("about.cta")}
                width={180} height={42} fontSize={14} tinted
                onClick={() => { window.location.href = "/espace" }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function getFeatures(t: (key: string) => string) {
  return [
    {
      key: "tree",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.55 0.15 150)" }}>
          <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          <path d="M12 22c4.5-2.5 7-6 7-10V5l-7-3-7 3v7c0 4 2.5 7.5 7 10z" />
          <path d="M12 6v4" /><path d="M10 12h4" /><path d="M12 14v4" />
        </svg>
      ),
      title: t("about.feature1.title"),
      description: t("about.feature1.desc"),
    },
    {
      key: "heart",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.60 0.18 15)" }}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0 2.63 2.63 0 0 1 0 3.79L12 19" />
        </svg>
      ),
      title: t("about.feature2.title"),
      description: t("about.feature2.desc"),
    },
    {
      key: "hand",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.55 0.15 250)" }}>
          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 16" />
        </svg>
      ),
      title: t("about.feature3.title"),
      description: t("about.feature3.desc"),
    },
  ]
}
