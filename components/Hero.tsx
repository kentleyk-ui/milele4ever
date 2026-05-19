"use client"

import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { LiquidMetalButton } from "./DynamicLiquidMetalButton"
import { Star } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { useRouter } from "next/navigation"

// Police Playfair chargée une seule fois dans app/layout.tsx via --font-playfair
const playfairDisplay = { className: "font-[family-name:var(--font-playfair)]" }

function Tooltip({ children, text, variant }: { children: React.ReactNode; text: string; variant?: 'aion' | 'aeternum' }) {
  const [show, setShow] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center')

  // Nuance de couleur par concept
  const accent = variant === 'aion'
    ? 'oklch(0.55 0.14 140)' // vert-doré chaleureux — temps terrestre
    : variant === 'aeternum'
    ? 'oklch(0.50 0.12 180)' // bleu-sarcelle éthéré — éternité
    : 'oklch(0.42 0.10 152)'

  const symbol = variant === 'aion' ? '◷' : variant === 'aeternum' ? '∞' : null
  const etymology = variant === 'aion' ? 'αἰών' : variant === 'aeternum' ? 'æternum' : null

  // Calcul de l'alignement pour rester dans le viewport
  useEffect(() => {
    if (!show || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const bubbleW = Math.min(288, window.innerWidth - 32) // w-72 max = 288px
    if (centerX - bubbleW / 2 < 16) setAlign('left')
    else if (centerX + bubbleW / 2 > window.innerWidth - 16) setAlign('right')
    else setAlign('center')
  }, [show])

  const positionStyle: React.CSSProperties =
    align === 'left' ? { left: 0, transform: 'none' }
    : align === 'right' ? { right: 0, left: 'auto', transform: 'none' }
    : { left: '50%', transform: 'translateX(-50%)' }

  const arrowPosition: React.CSSProperties =
    align === 'left' ? { left: '20px', transform: 'rotate(45deg)' }
    : align === 'right' ? { right: '20px', left: 'auto', transform: 'rotate(45deg)' }
    : { left: '50%', transform: 'translateX(-50%) rotate(45deg)' }

  return (
    <span
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={(e) => { e.preventDefault(); setShow(s => !s) }}
    >
      {children}
      {show && (
        <span
          className="absolute z-[100] bottom-full mb-3 w-[min(288px,calc(100vw-32px))] rounded-xl sm:rounded-2xl overflow-hidden text-[12px]/5 sm:text-[13px]/5 font-normal text-left pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200"
          style={{
            ...positionStyle,
            background: 'color-mix(in srgb, var(--popover) 94%, var(--primary))',
            backdropFilter: 'blur(28px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
            border: `1.5px solid color-mix(in srgb, ${accent} 35%, var(--border))`,
            color: 'var(--foreground)',
            boxShadow: `0 16px 48px oklch(0.08 0.03 150 / 0.35), 0 0 0 1px color-mix(in srgb, ${accent} 15%, transparent), 0 0 60px color-mix(in srgb, ${accent} 10%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.12)`,
          }}
        >
          {/* Barre d'accent colorée */}
          <div style={{ height: '2.5px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

          <div className="px-4 py-3">
            {/* En-tête avec symbole et étymologie */}
            <div className="flex items-center gap-2 mb-1.5">
              {symbol && <span style={{ color: accent, fontSize: '15px', opacity: 0.8 }}>{symbol}</span>}
              <span className="block font-bold text-[14px]" style={{ color: accent }}>{children}</span>
              {etymology && <span className="text-[10px] font-mono tracking-wider uppercase opacity-50" style={{ color: accent }}>{etymology}</span>}
            </div>
            <span className="text-[12.5px]/5 opacity-90" style={{ color: 'var(--muted-foreground)' }}>{text}</span>
          </div>

          {/* Flèche */}
          <span
            className="absolute -bottom-[6px] w-3 h-3"
            style={{
              ...arrowPosition,
              background: 'color-mix(in srgb, var(--popover) 94%, var(--primary))',
              borderRight: `1.5px solid color-mix(in srgb, ${accent} 35%, var(--border))`,
              borderBottom: `1.5px solid color-mix(in srgb, ${accent} 35%, var(--border))`,
            }}
          />
        </span>
      )}
    </span>
  )
}

export function Hero() {
  const { t } = useLocale()
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const pixelGridRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shouldRenderVideo, setShouldRenderVideo] = useState(true)

  // Ralentir la vidéo de fond
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.4
    }
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches
    const lowMemory = typeof navigator !== "undefined" && "deviceMemory" in navigator
      ? ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4
      : false
    const lowCpu = typeof navigator !== "undefined" && navigator.hardwareConcurrency > 0
      ? navigator.hardwareConcurrency <= 4
      : false

    setShouldRenderVideo(!(reducedMotion || (coarsePointer && (lowMemory || lowCpu))))
  }, [])

  const handleMouseLeave = () => {
    if (!shouldRenderVideo) return
    if (!cardRef.current || !pixelGridRef.current) return
    pixelGridRef.current.innerHTML = ""
    const rippleCount = 5
    for (let i = 0; i < rippleCount; i++) {
      const ripple = document.createElement("div")
      const size = 30 + Math.random() * 40
      const startX = 20 + Math.random() * 60
      const startY = 20 + Math.random() * 60
      ripple.style.position = "absolute"
      ripple.style.width = `${size}%`
      ripple.style.height = `${size}%`
      ripple.style.left = `${startX - size / 2}%`
      ripple.style.top = `${startY - size / 2}%`
      ripple.style.borderRadius = "50%"
      ripple.style.border = "1px solid oklch(0.42 0.10 152 / 0.15)"
      ripple.style.background = "radial-gradient(ellipse at center, oklch(0.50 0.08 150 / 0.06) 0%, transparent 70%)"
      ripple.style.opacity = "0"
      ripple.style.pointerEvents = "none"
      pixelGridRef.current.appendChild(ripple)
    }
    const ripples = Array.from(pixelGridRef.current.children) as HTMLElement[]

    cardRef.current.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.997)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 550,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    )

    ripples.forEach((ripple, i) => {
      const animation = ripple.animate(
        [
          { opacity: 0, transform: "scale(0.3)" },
          { opacity: 1, transform: "scale(1.2)" },
          { opacity: 0, transform: "scale(1.6)" },
        ],
        {
          duration: 1100,
          delay: i * 80,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      )

      animation.onfinish = () => ripple.remove()
    })
  }

  return (
    <section className="relative min-h-[72vh] sm:min-h-[78vh]" style={{background: 'var(--background)'}}>
      <style>{`
        .hero-bg-video {
          filter: sepia(0.5) hue-rotate(75deg) saturate(0.7) brightness(0.35) contrast(1.05);
        }
        :root .hero-bg-video {
          filter: sepia(0.5) hue-rotate(75deg) saturate(0.7) brightness(0.9) contrast(0.95);
          opacity: 0.4;
        }
        .hero-glow {
          background: radial-gradient(ellipse 60% 40% at 50% 35%, oklch(0.30 0.12 150 / 0.35) 0%, transparent 70%);
        }
        :root .hero-glow {
          background: radial-gradient(ellipse 60% 40% at 50% 35%, oklch(0.42 0.10 152 / 0.12) 0%, transparent 70%);
        }

        /* ═══ Medieval Calligraphy Title ═══ */
        .medieval-title {
          font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 0.06em;
          line-height: 0.95;
          /* Mode clair → tons sombres profonds, opaque et solide */
          background: linear-gradient(
            180deg,
            oklch(0.78 0.08 148) 0%,
            oklch(0.58 0.13 152) 35%,
            oklch(0.40 0.15 155) 65%,
            oklch(0.28 0.12 155) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter:
            drop-shadow(0 2px 0 oklch(0.18 0.10 155 / 0.7))
            drop-shadow(0 5px 0 oklch(0.14 0.08 155 / 0.4))
            drop-shadow(0 10px 20px oklch(0.10 0.10 150 / 0.5));
        }
        .dark .medieval-title {
          /* Mode sombre → tons clairs lumineux, solide */
          background: linear-gradient(
            180deg,
            oklch(0.97 0.02 145) 0%,
            oklch(0.85 0.06 148) 35%,
            oklch(0.72 0.09 150) 65%,
            oklch(0.60 0.08 152) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter:
            drop-shadow(0 2px 0 oklch(0.90 0.03 148 / 0.4))
            drop-shadow(0 5px 0 oklch(0.75 0.05 150 / 0.2))
            drop-shadow(0 10px 24px oklch(0.50 0.10 150 / 0.4));
        }
        /* Ornament SVG */
        .ornament-line {
          fill: none;
          stroke: oklch(0.45 0.10 152 / 0.4);
          stroke-width: 1.2;
          stroke-linecap: round;
        }
        .dark .ornament-line {
          stroke: oklch(0.75 0.08 148 / 0.35);
        }
        .ornament-dot {
          fill: oklch(0.45 0.10 152 / 0.5);
        }
        .dark .ornament-dot {
          fill: oklch(0.75 0.08 148 / 0.4);
        }
      `}</style>

      {/* ═══ Barre de navigation SANS logo Milele ═══ */}
      <nav className="relative z-30 flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4 md:px-10 md:py-5">
        <div className="w-10 md:w-[170px]" />
        <div className="hidden md:flex items-center justify-center gap-8 flex-1">
          <Link href="/a-propos" className="text-[13px] font-medium tracking-wide uppercase transition-colors hover:opacity-70 min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg" tabIndex={0} aria-label="À propos">
            {t('nav.about')}
          </Link>
          <Link href="/services" className="text-[13px] font-medium tracking-wide uppercase transition-colors hover:opacity-70 min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg" tabIndex={0} aria-label="Services">
            {t('nav.services')}
          </Link>
          <Link href="/aion" className="text-[13px] font-medium tracking-wide uppercase transition-colors hover:opacity-70 min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg" tabIndex={0} aria-label="Aïon">
            {t('nav.aion')}
          </Link>
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-3 md:w-[170px]">
          {/* Menu hamburger mobile */}
          <button
            className="md:hidden flex flex-col gap-1 p-2 touch-manipulation min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            tabIndex={0}
          >
            <span className="block w-5 h-0.5 rounded-full transition-all duration-300" style={{ background: 'var(--foreground)', transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span className="block w-5 h-0.5 rounded-full transition-all duration-300" style={{ background: 'var(--foreground)', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span className="block w-5 h-0.5 rounded-full transition-all duration-300" style={{ background: 'var(--foreground)', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
          <div className="md:hidden">
            <LiquidMetalButton
              label="Staff"
              width={92}
              height={34}
              fontSize={11}
              tinted
              onClick={() => { window.location.href = '/staff' }}
              className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              tabIndex={0}
              aria-label="Accès staff"
            />
          </div>
          <div className="hidden md:block">
            <LiquidMetalButton
              label="Accès Staff"
              width={148}
              height={34}
              fontSize={12}
              tinted
              onClick={() => { window.location.href = '/staff' }}
              className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              tabIndex={0}
              aria-label="Accès staff"
            />
          </div>
          <div className="hidden sm:block">
            <LiquidMetalButton
              label={t('nav.login')}
              width={148}
              height={34}
              fontSize={12}
              tinted
              onClick={() => { window.location.href = '/espace/membres' }}
              className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              tabIndex={0}
              aria-label="Se connecter"
            />
          </div>
          <div className="hidden sm:block">
            <LiquidMetalButton
              label={t('nav.signup')}
              width={148}
              height={34}
              fontSize={12}
              tinted
              onClick={() => { window.location.href = '/inscription' }}
              className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              tabIndex={0}
              aria-label="Créer un compte"
            />
          </div>
        </div>
      </nav>

      {/* Menu mobile déroulant */}
      {mobileMenuOpen && (
        <div
          className="md:hidden relative z-30 mx-4 mb-2 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: 'color-mix(in srgb, var(--card) 90%, transparent)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
          }}
        >
          <Link href="/a-propos" className="text-[13px] font-medium tracking-wide uppercase py-1" style={{color: 'var(--muted-foreground)'}} onClick={() => setMobileMenuOpen(false)}>
            {t('nav.about')}
          </Link>
          <Link href="/services" className="text-[13px] font-medium tracking-wide uppercase py-1" style={{color: 'var(--muted-foreground)'}} onClick={() => setMobileMenuOpen(false)}>
            {t('nav.services')}
          </Link>
          <Link href="/aion" className="text-[13px] font-medium tracking-wide uppercase py-1" style={{color: 'var(--muted-foreground)'}} onClick={() => setMobileMenuOpen(false)}>
            {t('nav.aion')}
          </Link>
          <div>
            <LiquidMetalButton
              label="Accès Staff"
              width={undefined}
              height={38}
              fontSize={12}
              tinted
              onClick={() => { window.location.href = '/staff'; setMobileMenuOpen(false) }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <LiquidMetalButton
              label={t('nav.login')}
              width={undefined}
              height={38}
              fontSize={12}
              tinted
              onClick={() => { window.location.href = '/espace/membres'; setMobileMenuOpen(false) }}
            />
            <LiquidMetalButton
              label={t('nav.signup')}
              width={undefined}
              height={38}
              fontSize={12}
              tinted
              onClick={() => { window.location.href = '/inscription'; setMobileMenuOpen(false) }}
            />
          </div>
        </div>
      )}

      {/* ═══ Hero visuel ═══ */}
      <div className="relative overflow-hidden" style={{minHeight: 'max(55vh, 350px)'}}>
        {/* Vidéo fond — ralentie */}
        {shouldRenderVideo ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover hero-bg-video"
          >
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/liquid-metal-video_yX6NvjdW-6bLYorR3Ihmlwjivg3pjA978qrSKRU.mp4" type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 40%), linear-gradient(180deg, color-mix(in srgb, var(--secondary) 32%, var(--background)), var(--background))",
            }}
          />
        )}

        {/* Glow vert subtil */}
        <div className="absolute inset-0 hero-glow" />

        {/* Fondu bas */}
        <div className="pointer-events-none absolute inset-0" style={{background: 'linear-gradient(to bottom, transparent 50%, var(--background) 100%)'}} />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          {/* Fleuron ornemental — fil de fer */}
          <div className="mb-4 sm:mb-6">
            <svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="sm:w-[80px] sm:h-[52px] md:w-[100px] md:h-[64px]">
              {/* Feuille gauche — contour fil de fer */}
              <path d="M 30 20 C 22 10, 8 8, 6 18 C 4 26, 16 28, 30 20" className="ornament-line" />
              {/* Feuille droite — contour fil de fer */}
              <path d="M 30 20 C 38 10, 52 8, 54 18 C 56 26, 44 28, 30 20" className="ornament-line" />
              {/* Tige haute */}
              <path d="M 30 4 L 30 20" className="ornament-line" style={{ strokeWidth: 0.8 }} />
              {/* Tige basse */}
              <path d="M 30 20 L 30 36" className="ornament-line" style={{ strokeWidth: 0.8 }} />
              {/* Centre — petit noeud */}
              <circle cx="30" cy="20" r="2.5" className="ornament-line" style={{ strokeWidth: 1 }} />
              {/* Pointes */}
              <circle cx="30" cy="4" r="1.2" className="ornament-dot" />
              <circle cx="30" cy="36" r="1.2" className="ornament-dot" />
            </svg>
          </div>

          <div className="relative">
            {/* Couche unique — calligraphie médiévale solide */}
            <div className={`${playfairDisplay.className} medieval-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl relative`} aria-hidden="true">
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 900 }}>
                <span className="inline-block" style={{ fontSize: '1.15em', marginRight: '-0.02em' }}>M</span>
                ilele
              </span>
            </div>
          </div>

          {/* Séparateur ornemental — fil de fer */}
          <svg className="mt-5 sm:mt-6" width="180" height="20" viewBox="0 0 180 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Ligne ondulée centrale */}
            <path d="M 10 10 Q 45 4, 80 10 T 170 10" className="ornament-line" />
            {/* Losange central — contour fil de fer */}
            <path d="M 90 4 L 94 10 L 90 16 L 86 10 Z" className="ornament-line" style={{ strokeWidth: 1.2 }} />
            {/* Petits noeuds */}
            <circle cx="20" cy="10" r="1.8" className="ornament-dot" />
            <circle cx="160" cy="10" r="1.8" className="ornament-dot" />
            {/* Boucles fil de fer aux extrémités */}
            <path d="M 10 10 C 5 5, 2 8, 4 12 C 6 16, 9 13, 10 10" className="ornament-line" style={{ strokeWidth: 0.8 }} />
            <path d="M 170 10 C 175 5, 178 8, 176 12 C 174 16, 171 13, 170 10" className="ornament-line" style={{ strokeWidth: 0.8 }} />
          </svg>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg font-semibold tracking-wide" style={{color: 'var(--foreground)'}}>
            {t('hero.meaning')}
          </p>
        </div>
      </div>

      {/* ═══ Contenu textuel ═══ */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 md:px-8 -mt-8 pb-12 sm:pb-16">
        <div
          ref={cardRef}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-2xl sm:rounded-3xl backdrop-blur-2xl p-6 sm:p-8 md:p-12 transition-all duration-500 ease-out"
          style={{
            background: 'color-mix(in srgb, var(--card) 85%, transparent)',
            border: '1px solid var(--border)',
            boxShadow: shouldRenderVideo
              ? '0 24px 64px oklch(0.10 0.03 150 / 0.15), 0 0 0 1px oklch(0.42 0.10 152 / 0.04)'
              : '0 8px 24px oklch(0.10 0.03 150 / 0.10)',
            overflow: 'visible',
          }}
        >
          <div ref={pixelGridRef} className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-3xl" />

          <blockquote className="border-l-2 pl-4 sm:pl-6 text-[13px]/6 sm:text-[15px]/7 md:text-base/7 text-justify" style={{borderColor: 'var(--primary)', color: 'var(--muted-foreground)'}}>
            {t('hero.quote1')}
          </blockquote>

          <blockquote className="mt-8 border-l-2 pl-4 sm:pl-6 text-[13px]/6 sm:text-[15px]/7 md:text-base/7 text-justify" style={{borderColor: 'var(--primary)', color: 'var(--muted-foreground)'}}>
            <Tooltip variant="aion" text={t('tooltip.aion')}><span className="font-bold cursor-help border-b border-dashed" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>Aïon</span></Tooltip> {t('hero.quote2.connector')} <Tooltip variant="aeternum" text={t('tooltip.aeternum')}><span className="font-bold cursor-help border-b border-dashed" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>Aeternum</span></Tooltip>{t('hero.quote2.suffix')}
          </blockquote>

          <blockquote className="mt-4 border-l-2 pl-4 sm:pl-6 text-[13px]/6 sm:text-[15px]/7 md:text-base/7 text-justify" style={{borderColor: 'var(--primary)', color: 'var(--muted-foreground)'}}>
            <Tooltip variant="aion" text={t('tooltip.aion')}><span className="font-bold cursor-help border-b border-dashed" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>Aïon</span></Tooltip>{t('hero.quote3')}
          </blockquote>

          <blockquote className="mt-4 border-l-2 pl-4 sm:pl-6 text-[13px]/6 sm:text-[15px]/7 md:text-base/7 text-justify" style={{borderColor: 'var(--primary)', color: 'var(--muted-foreground)'}}>
            <Tooltip variant="aeternum" text={t('tooltip.aeternum')}><span className="font-bold cursor-help border-b border-dashed" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>Aeternum</span></Tooltip>{t('hero.quote4')}
          </blockquote>

          <blockquote className="mt-4 border-l-2 pl-4 sm:pl-6 text-[13px]/6 sm:text-[15px]/7 md:text-base/7 text-justify" style={{borderColor: 'var(--primary)', color: 'var(--muted-foreground)'}}>
            {t('hero.quote5')} <Tooltip variant="aion" text={t('tooltip.aion')}><span className="font-bold cursor-help border-b border-dashed" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>Aïon</span></Tooltip> {t('hero.quote5b')} <Tooltip variant="aeternum" text={t('tooltip.aeternum')}><span className="font-bold cursor-help border-b border-dashed" style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>Aeternum</span></Tooltip>.
          </blockquote>

          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm md:text-base italic" style={{color: 'var(--muted-foreground)', opacity: 0.8}}>
            {t('hero.tagline')}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <LiquidMetalButton
              label={t('hero.cta')}
              width={130}
              height={38}
              fontSize={13}
              tinted
              onClick={() => { window.location.href = '/espace' }}
              className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              tabIndex={0}
              aria-label="Commencer sans compte"
            />
            <LiquidMetalButton
              label="Accès Staff"
              width={130}
              height={38}
              fontSize={13}
              tinted
              iconNode={<Star className="mr-2" size={18} />}
              onClick={() => router.push('/staff')}
              className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              tabIndex={0}
              aria-label="Accès Staff"
            />
            <LiquidMetalButton
              label={t('hero.explore')}
              width={180}
              height={38}
              fontSize={13}
              tinted
              onClick={() => { window.location.href = '/hommages' }}
            />
          </div>
        </div>

        {/* Flèche vers le bas */}
        <div className="mt-8 flex justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--muted-foreground)', opacity: 0.4}} className="animate-bounce">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  )
}
