"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"

export function Services() {
  const { t } = useLocale()

  const services = [
    {
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Bougie funéraire avec flamme dorée */}
          <defs>
            <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FF8C00" />
            </linearGradient>
            <linearGradient id="candle-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5F0E8" />
              <stop offset="100%" stopColor="#E8DDD0" />
            </linearGradient>
          </defs>
          <path d="M12 2.5c.6 1.2 0 2.5-.3 3.3-.3.8.3 1.7.8 1.7s1.2-.8.8-1.7c-.4-.8-1.3-2.1-.8-3.3z" fill="url(#flame-grad)" />
          <ellipse cx="12" cy="7.8" rx="1.2" ry="0.5" fill="#FF8C00" opacity="0.4" />
          <rect x="10.2" y="8" width="3.6" height="11" rx="1.8" fill="url(#candle-grad)" stroke="#C9B896" strokeWidth="0.8" />
          <path d="M8.5 19.5h7a1 1 0 0 1 1 1v.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1z" fill="#8B7355" stroke="#6B5B45" strokeWidth="0.6" />
        </svg>
      ),
      title: t('services.funeraires'),
      slug: "funeraires",
    },
    {
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Rose blanche élégante */}
          <defs>
            <linearGradient id="petal-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF5F5" />
              <stop offset="100%" stopColor="#FFE4E8" />
            </linearGradient>
            <linearGradient id="stem-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4CAF50" />
              <stop offset="100%" stopColor="#2E7D32" />
            </linearGradient>
          </defs>
          <path d="M12 14v8" stroke="url(#stem-grad)" strokeWidth="1.5" />
          <ellipse cx="10" cy="19" rx="2.5" ry="1" fill="#4CAF50" opacity="0.6" />
          <ellipse cx="14" cy="20" rx="2" ry="0.8" fill="#4CAF50" opacity="0.5" />
          <ellipse cx="12" cy="9" rx="4" ry="5" fill="url(#petal-grad)" stroke="#E8B4B8" strokeWidth="0.7" />
          <path d="M9 8c1-2 2-3 3-3s2 1 3 3" fill="#FFF0F2" stroke="#E8B4B8" strokeWidth="0.5" />
          <path d="M10 10c.5-1 1.5-1.5 2-1.5s1.5.5 2 1.5" fill="#FFE8EC" stroke="#E8B4B8" strokeWidth="0.4" />
          <circle cx="12" cy="8" r="1.5" fill="#FFD4DC" opacity="0.6" />
        </svg>
      ),
      title: t('services.fleuristes'),
      slug: "fleuristes",
    },
    {
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Document officiel avec sceau */}
          <defs>
            <linearGradient id="doc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF9E6" />
              <stop offset="100%" stopColor="#F5ECD0" />
            </linearGradient>
          </defs>
          <rect x="5" y="2" width="14" height="18" rx="1.5" fill="url(#doc-grad)" stroke="#C9A96E" strokeWidth="0.8" />
          <path d="M14 2v4h5" fill="#EDE4C8" stroke="#C9A96E" strokeWidth="0.6" />
          <line x1="8" y1="8" x2="16" y2="8" stroke="#8B7355" strokeWidth="0.8" opacity="0.5" />
          <line x1="8" y1="11" x2="14" y2="11" stroke="#8B7355" strokeWidth="0.8" opacity="0.4" />
          <line x1="8" y1="14" x2="15" y2="14" stroke="#8B7355" strokeWidth="0.8" opacity="0.3" />
          <circle cx="14" cy="18" r="2.5" fill="#C41E3A" opacity="0.85" />
          <circle cx="14" cy="18" r="1.5" fill="#E63950" opacity="0.6" />
          <path d="M12 21l2-1 2 1" stroke="#C41E3A" strokeWidth="0.8" fill="#C41E3A" opacity="0.7" />
        </svg>
      ),
      title: t('services.notaires'),
      slug: "notaires",
    },
    {
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Patte d'animal colorée */}
          <defs>
            <linearGradient id="paw-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A1887F" />
              <stop offset="100%" stopColor="#795548" />
            </linearGradient>
          </defs>
          <ellipse cx="8.5" cy="6.5" rx="2.2" ry="2.8" fill="url(#paw-grad)" />
          <ellipse cx="15.5" cy="6.5" rx="2.2" ry="2.8" fill="url(#paw-grad)" />
          <ellipse cx="5.5" cy="11.5" rx="2" ry="2.5" fill="url(#paw-grad)" />
          <ellipse cx="18.5" cy="11.5" rx="2" ry="2.5" fill="url(#paw-grad)" />
          <path d="M9 14.5c1.2 1.8 2.2 3.5 3 4.5.8 1 1.8 1 3-.5 1-1.2 1.2-2.8-.2-4.2s-2.8-2.3-4-2c-1.2.3-3 .5-1.8 2.2z" fill="url(#paw-grad)" />
          <ellipse cx="8.5" cy="6.5" rx="1.2" ry="1.5" fill="#D7CCC8" opacity="0.4" />
          <ellipse cx="15.5" cy="6.5" rx="1.2" ry="1.5" fill="#D7CCC8" opacity="0.4" />
        </svg>
      ),
      title: t('services.animaux'),
      slug: "animaux",
    },
    {
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Cloche de service dorée */}
          <defs>
            <linearGradient id="cloche-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <linearGradient id="plate-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8E8E8" />
              <stop offset="100%" stopColor="#BDBDBD" />
            </linearGradient>
          </defs>
          <ellipse cx="12" cy="19.5" rx="10" ry="1.5" fill="url(#plate-grad)" />
          <path d="M4 19c0-5 2.5-8.5 5-10.5" stroke="url(#cloche-grad)" strokeWidth="1.5" fill="none" />
          <path d="M20 19c0-5-2.5-8.5-5-10.5" stroke="url(#cloche-grad)" strokeWidth="1.5" fill="none" />
          <path d="M4 19h16" stroke="#B8860B" strokeWidth="1.8" />
          <path d="M9 8.5c1.2-1.5 2.5-2 3-2s1.8.5 3 2" stroke="url(#cloche-grad)" strokeWidth="1.5" fill="none" />
          <line x1="12" y1="3.5" x2="12" y2="6.5" stroke="#DAA520" strokeWidth="1.2" />
          <circle cx="12" cy="3" r="1" fill="#FFD700" />
          <ellipse cx="12" cy="13" rx="6.5" ry="6" fill="url(#cloche-grad)" opacity="0.12" />
        </svg>
      ),
      title: t('services.traiteurs'),
      slug: "traiteurs",
    },
    {
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Véhicule élégant noir */}
          <defs>
            <linearGradient id="car-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#424242" />
              <stop offset="100%" stopColor="#1A1A1A" />
            </linearGradient>
            <linearGradient id="window-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#90CAF9" />
              <stop offset="100%" stopColor="#42A5F5" />
            </linearGradient>
          </defs>
          <path d="M3 15h18v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3z" fill="url(#car-grad)" />
          <path d="M5 15v-3a1 1 0 0 1 1-1h4l2.5-3.5h3L18 11h1a2 2 0 0 1 2 2v2" fill="url(#car-grad)" />
          <path d="M7 11h4.5l1.5-2.5" stroke="#616161" strokeWidth="0.5" fill="url(#window-grad)" opacity="0.7" />
          <path d="M13.5 11h4" stroke="#616161" strokeWidth="0.5" fill="url(#window-grad)" opacity="0.7" />
          <circle cx="7" cy="19" r="2" fill="#333" stroke="#555" strokeWidth="0.8" />
          <circle cx="7" cy="19" r="0.8" fill="#888" />
          <circle cx="17" cy="19" r="2" fill="#333" stroke="#555" strokeWidth="0.8" />
          <circle cx="17" cy="19" r="0.8" fill="#888" />
          <rect x="4" y="16" width="2" height="1" rx="0.5" fill="#FDD835" opacity="0.9" />
          <rect x="18" y="16" width="2" height="1" rx="0.5" fill="#EF5350" opacity="0.8" />
        </svg>
      ),
      title: t('services.transport'),
      slug: "transport",
    },
  ]

  return (
    <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6 md:px-8 border-t" style={{background: 'var(--background)', borderColor: 'color-mix(in srgb, var(--primary) 15%, var(--border))'}}>
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight" style={{color: 'var(--foreground)'}}>
          {t('services.title')}
        </h2>
        <div className="mt-3 mx-auto flex items-center gap-2 justify-center">
          <div className="h-[2px] w-8 rounded-full" style={{background: 'var(--primary)', opacity: 0.4}} />
          <div className="w-1.5 h-1.5 rounded-full" style={{background: 'var(--primary)'}} />
          <div className="h-[2px] w-8 rounded-full" style={{background: 'var(--primary)', opacity: 0.4}} />
        </div>
        <p className="mt-4 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{color: 'var(--muted-foreground)'}}>
          {t('services.desc')}
        </p>

        <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══ Carte service avec texture métallique + dispersion lumineuse au hover ═══ */
function ServiceCard({ service }: { service: { icon: React.ReactNode; title: string; slug: string } }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
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

  const metalBase = isLight
    ? 'linear-gradient(135deg, oklch(0.94 0.005 150) 0%, oklch(0.90 0.01 152) 30%, oklch(0.95 0.008 148) 60%, oklch(0.88 0.012 155) 100%)'
    : 'linear-gradient(135deg, oklch(0.20 0.015 150) 0%, oklch(0.17 0.02 152) 30%, oklch(0.22 0.01 148) 60%, oklch(0.16 0.025 155) 100%)'

  const disperseColor = isLight
    ? 'oklch(0.55 0.12 150 / 0.25)'
    : 'oklch(0.50 0.14 150 / 0.30)'

  const shimmerColor = isLight
    ? 'oklch(0.98 0.02 145 / 0.6)'
    : 'oklch(0.70 0.08 150 / 0.25)'

  const slug = service.slug

  return (
    <a
      href={`/services?cat=${slug}`}
      ref={cardRef}
      className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 transition-all duration-500 hover:-translate-y-1 active:-translate-y-0.5 cursor-pointer overflow-hidden touch-manipulation no-underline"
      style={{
        background: metalBase,
        border: '1px solid color-mix(in srgb, var(--primary) 10%, var(--border))',
        color: 'var(--muted-foreground)',
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }) }}
    >
      {/* Texture métallique subtile */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.7 : 0.3,
          backgroundImage: `
            radial-gradient(ellipse 120% 80% at 30% 20%, ${isLight ? 'oklch(0.97 0.01 148 / 0.5)' : 'oklch(0.30 0.02 150 / 0.3)'} 0%, transparent 70%),
            radial-gradient(ellipse 80% 120% at 70% 80%, ${isLight ? 'oklch(0.92 0.015 155 / 0.4)' : 'oklch(0.25 0.03 155 / 0.25)'} 0%, transparent 60%),
            linear-gradient(180deg, transparent 0%, ${isLight ? 'oklch(0.96 0.006 150 / 0.3)' : 'oklch(0.18 0.01 150 / 0.2)'} 50%, transparent 100%)
          `,
        }}
      />

      {/* Dispersion lumineuse qui suit le pointeur */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `
            radial-gradient(circle 150px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${disperseColor} 0%, transparent 60%),
            radial-gradient(circle 80px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${shimmerColor} 0%, transparent 50%)
          `,
        }}
      />

      {/* Reflet spéculaire */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isHovered ? 0.5 : 0,
          background: `radial-gradient(circle 40px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${isLight ? 'oklch(1 0 0 / 0.3)' : 'oklch(0.90 0.04 150 / 0.15)'} 0%, transparent 100%)`,
        }}
      />

      {/* Glow au hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{boxShadow: '0 0 40px oklch(0.42 0.10 152 / 0.1)'}} />

      {/* Bordure lumineuse au hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          border: '1px solid color-mix(in srgb, var(--primary) 30%, var(--border))',
          boxShadow: `inset 0 1px 0 ${isLight ? 'oklch(1 0 0 / 0.15)' : 'oklch(0.60 0.05 150 / 0.08)'}`,
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110" style={{background: 'color-mix(in srgb, var(--primary) 8%, transparent)'}}>
          {service.icon}
        </div>
        <span className="text-[11px] sm:text-[13px] font-semibold tracking-wide text-center" style={{color: 'var(--foreground)'}}>
          {service.title}
        </span>
      </div>
    </a>
  )
}
