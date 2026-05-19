"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Info } from "lucide-react"
import { useLocale } from "@/lib/locale-context"

export function Features() {
  const { t } = useLocale()
  const [showBubble, setShowBubble] = useState(false)

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'oklch(0.55 0.15 150)'}}>
          <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          <path d="M12 22c4.5-2.5 7-6 7-10V5l-7-3-7 3v7c0 4 2.5 7.5 7 10z" />
          <path d="M12 6v4" /><path d="M10 12h4" /><path d="M12 14v4" />
        </svg>
      ),
      title: t('features.card1.title'),
      description: t('features.card1.desc'),
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'oklch(0.60 0.18 15)'}}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0 2.63 2.63 0 0 1 0 3.79L12 19" />
        </svg>
      ),
      title: t('features.card2.title'),
      description: t('features.card2.desc'),
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'oklch(0.55 0.15 250)'}}>
          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 16" />
        </svg>
      ),
      title: t('features.card3.title'),
      description: t('features.card3.desc'),
    },
  ]

  return (
    <section id="a-propos" className="relative py-12 sm:py-20 md:py-28 px-4 sm:px-6 md:px-8 overflow-hidden" style={{background: 'var(--background)'}}>
      {/* Orbe décoratif */}
      <div className="orb orb-primary animate-float-slow" style={{ width: 400, height: 400, top: "-15%", right: "-8%", opacity: 0.4 }} />
      <div className="orb orb-accent animate-float-medium" style={{ width: 250, height: 250, bottom: "5%", left: "-5%", opacity: 0.3 }} />

      <div className="mx-auto max-w-3xl relative">
        {/* Titre de section */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-[2px] w-10 rounded-full" style={{background: 'var(--primary)', opacity: 0.5}} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{color: 'var(--primary)'}}>{t('features.section')}</span>
            <div className="h-[2px] w-10 rounded-full" style={{background: 'var(--primary)', opacity: 0.5}} />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{color: 'var(--foreground)'}}>
            {t('features.title1')}
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 gradient-text"
            style={{fontFamily: "'Playfair Display', serif", fontStyle: 'italic'}}>
            {t('features.title2')}
          </p>
        </div>

        {/* Texte résumé + bulle info */}
        <div className="space-y-6 sm:space-y-8 mb-14 sm:mb-20">
          <p className="text-sm sm:text-base leading-relaxed text-center" style={{color: 'var(--muted-foreground)'}}>
            <span className="font-semibold" style={{color: 'var(--primary)'}}>Milele</span> <span dangerouslySetInnerHTML={{ __html: t('features.intro') }} />
          </p>

          {/* Phrase centrale avec bulle info */}
          <div className="relative flex items-center justify-center gap-2">
            <p className="text-base sm:text-lg leading-relaxed text-center font-semibold" style={{color: 'var(--foreground)'}}>
              {t('features.central')}
            </p>
            <button
              onClick={() => setShowBubble(!showBubble)}
              className="shrink-0 p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                color: 'var(--primary)',
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                touchAction: 'manipulation',
              }}
              aria-label={t('features.info')}
              tabIndex={0}
            >
              <Info size={20} />
            </button>

            {/* Bulle d'information */}
            {showBubble && (
              <div
                className="absolute z-50 top-full mt-3 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[min(420px,calc(100vw-32px))] rounded-2xl overflow-hidden"
                style={{
                  background: 'color-mix(in srgb, var(--popover) 95%, var(--primary))',
                  backdropFilter: 'blur(28px) saturate(1.5)',
                  WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
                  border: '1.5px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
                  boxShadow: '0 20px 60px oklch(0.08 0.04 150 / 0.35), 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.1)',
                  animation: 'bubbleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              >
                {/* Barre accent */}
                <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }} />

                <div className="px-5 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                  <p className="text-[12.5px] sm:text-[13px] leading-relaxed" style={{color: 'var(--muted-foreground)'}}>
                    {t('features.bubble1')}
                  </p>
                  <p className="text-[13px] sm:text-[14px] leading-relaxed font-semibold" style={{color: 'var(--foreground)'}}>
                    {t('features.bubble2')}
                  </p>
                  <p className="text-[12.5px] sm:text-[13px] leading-relaxed" style={{color: 'var(--muted-foreground)'}} dangerouslySetInnerHTML={{ __html: t('features.bubble3') }} />
                  <div className="border-l-2 pl-4 py-1" style={{borderColor: 'var(--primary)'}}>
                    <p className="text-[12.5px] sm:text-[13px] leading-relaxed" style={{color: 'var(--foreground)'}} dangerouslySetInnerHTML={{ __html: t('features.bubble4') }} />
                    <p className="mt-2 text-[12.5px] sm:text-[13px] leading-relaxed" style={{color: 'var(--muted-foreground)'}} dangerouslySetInnerHTML={{ __html: t('features.bubble5') }} />
                  </div>
                  <p className="text-[12.5px] sm:text-[13px] leading-relaxed" style={{color: 'var(--muted-foreground)'}} dangerouslySetInnerHTML={{ __html: t('features.bubble6') }} />
                  <p className="text-[13px] font-semibold text-center pt-1" style={{color: 'var(--primary)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic'}}>
                    {t('features.bubble7')}
                  </p>
                </div>

                {/* Lien vers page complète */}
                <div className="px-5 py-3 text-center" style={{borderTop: '1px solid color-mix(in srgb, var(--primary) 8%, var(--border))'}}>
                  <Link href="/a-propos" className="text-[12px] font-medium tracking-wide uppercase transition-opacity hover:opacity-70" style={{color: 'var(--primary)'}}>
                    {t('features.readmore')}
                  </Link>
                </div>

                {/* Flèche */}
                <span
                  className="absolute left-1/2 -translate-x-1/2 -top-[7px] w-3.5 h-3.5 rotate-45"
                  style={{
                    background: 'color-mix(in srgb, var(--card) 88%, transparent)',
                    borderLeft: '1px solid color-mix(in srgb, var(--primary) 15%, var(--border))',
                    borderTop: '1px solid color-mix(in srgb, var(--primary) 15%, var(--border))',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes bubbleIn {
            from { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.96); }
            to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
        `}</style>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-14 sm:mb-20">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>

        {/* Closing */}
        <div className="text-center mt-10 space-y-3">
          <p className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>
            {t('features.closing')}
          </p>
          <Link href="/a-propos" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide underline-animated transition-opacity hover:opacity-80"
            style={{color: 'var(--primary)'}}>
            {t('features.learnmore')}
            <span className="text-base">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══ Carte avec texture métallique subtile + dispersion lumineuse au hover ═══ */
function FeatureCard({ feature }: { feature: { icon: React.ReactNode; title: string; description: string } }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [isHovered, setIsHovered] = useState(false)
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const check = () => setIsLight(!document.documentElement.classList.contains("dark"))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }, [])

  // Couleurs selon le thème
  const metalBase = isLight
    ? 'linear-gradient(135deg, oklch(0.94 0.005 150) 0%, oklch(0.90 0.01 152) 30%, oklch(0.95 0.008 148) 60%, oklch(0.88 0.012 155) 100%)'
    : 'linear-gradient(135deg, oklch(0.20 0.015 150) 0%, oklch(0.17 0.02 152) 30%, oklch(0.22 0.01 148) 60%, oklch(0.16 0.025 155) 100%)'

  const disperseColor = isLight
    ? 'oklch(0.55 0.12 150 / 0.25)'
    : 'oklch(0.50 0.14 150 / 0.30)'

  const shimmerColor = isLight
    ? 'oklch(0.98 0.02 145 / 0.6)'
    : 'oklch(0.70 0.08 150 / 0.25)'

  return (
    <div
      ref={cardRef}
      className="group relative rounded-xl sm:rounded-2xl p-5 sm:p-7 text-center transition-all duration-500 hover:-translate-y-1 active:-translate-y-0.5 cursor-pointer overflow-hidden touch-manipulation"
      style={{
        background: metalBase,
        border: '1px solid color-mix(in srgb, var(--primary) 15%, var(--border))',
        willChange: 'transform',
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }) }}
    >
      {/* Texture métallique subtile — bruit simulé par gradient radial superposé */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.7 : 0.3,
          backgroundImage: `
            radial-gradient(ellipse 120% 80% at 30% 20%, ${isLight ? 'oklch(0.97 0.01 148 / 0.5)' : 'oklch(0.30 0.02 150 / 0.3)'} 0%, transparent 70%),
            radial-gradient(ellipse 80% 120% at 70% 80%, ${isLight ? 'oklch(0.92 0.015 155 / 0.4)' : 'oklch(0.25 0.03 155 / 0.25)'} 0%, transparent 60%),
            linear-gradient(180deg, transparent 0%, ${isLight ? 'oklch(0.96 0.006 150 / 0.3)' : 'oklch(0.18 0.01 150 / 0.2)'} 50%, transparent 100%)
          `,
          willChange: 'opacity',
        }}
      />

      {/* Effet de dispersion lumineuse qui suit le pointeur */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `
            radial-gradient(circle 180px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${disperseColor} 0%, transparent 60%),
            radial-gradient(circle 100px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${shimmerColor} 0%, transparent 50%)
          `,
          willChange: 'opacity',
        }}
      />

      {/* Reflet spéculaire qui suit le curseur */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isHovered ? 0.5 : 0,
          background: `radial-gradient(circle 50px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${isLight ? 'oklch(1 0 0 / 0.3)' : 'oklch(0.90 0.04 150 / 0.15)'} 0%, transparent 100%)`,
          willChange: 'opacity',
        }}
      />

      {/* Glow subtil au hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{boxShadow: '0 0 50px oklch(0.42 0.10 152 / 0.15), 0 8px 32px oklch(0.10 0.03 150 / 0.12)', willChange: 'opacity'}}
      />

      {/* Accent bar top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-12 rounded-b-full opacity-60 group-hover:w-20 group-hover:opacity-100 transition-all duration-500" style={{background: 'var(--primary)'}} />

      {/* Bordure lumineuse au hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          border: `1px solid color-mix(in srgb, var(--primary) ${isHovered ? '30%' : '15%'}, var(--border))`,
          boxShadow: `inset 0 1px 0 ${isLight ? 'oklch(1 0 0 / 0.15)' : 'oklch(0.60 0.05 150 / 0.08)'}`,
        }}
      />

      {/* Contenu */}
      <div className="relative z-10">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
        style={{background: 'color-mix(in srgb, var(--primary) 12%, transparent)', willChange: 'transform'}}>
          {feature.icon}
        </div>
        <h3 className="text-sm font-bold tracking-wide uppercase" style={{color: 'var(--foreground)'}}>
          {feature.title}
        </h3>
        <p className="mt-2.5 text-[13px] leading-relaxed" style={{color: 'var(--muted-foreground)'}}>
          {feature.description}
        </p>
      </div>
    </div>
  )
}
