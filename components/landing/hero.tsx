'use client'

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { parseHtmlInText } from "@/lib/i18n/parse-html"
import { useEffect, useState } from "react"

export function Hero() {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <section 
      id="main-content" 
      className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center relative overflow-hidden" 
      role="main" 
      aria-labelledby="hero-title"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
      </div>

      <div className={`max-w-4xl mx-auto space-y-10 relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Titre principal — "Milele" seul, élégant */}
        <div className="flex flex-col items-center gap-4">
          {/* Symbole infini 3D ruban vert */}
          <div className="flex items-center gap-4 w-full max-w-lg justify-center">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-primary/60" />
            <svg
              className="infinity-symbol"
              width="200"
              height="72"
              viewBox="0 0 200 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Symbole infini éternel"
            >
              <defs>
                {/* Dégradés verts pour l'effet 3D */}
                <linearGradient id="g-ribbon-top" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#166534" stopOpacity="0.95" />
                  <stop offset="25%"  stopColor="#16a34a" stopOpacity="1" />
                  <stop offset="50%"  stopColor="#4ade80" stopOpacity="1" />
                  <stop offset="75%"  stopColor="#16a34a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#166534" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="g-ribbon-bot" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#14532d" stopOpacity="0.9" />
                  <stop offset="25%"  stopColor="#15803d" stopOpacity="0.95" />
                  <stop offset="50%"  stopColor="#22c55e" stopOpacity="0.9" />
                  <stop offset="75%"  stopColor="#15803d" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#14532d" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="g-ribbon-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#4ade80" stopOpacity="1" />
                  <stop offset="50%"  stopColor="#166534" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="g-shine-left" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#bbf7d0" stopOpacity="0.8" />
                  <stop offset="60%"  stopColor="#16a34a" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="g-shine-right" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#bbf7d0" stopOpacity="0.8" />
                  <stop offset="60%"  stopColor="#16a34a" stopOpacity="0.2" />
                </linearGradient>
                <filter id="f-glow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ombre portée */}
              <path
                d="M100 36 C88 56, 62 68, 44 62 C20 54, 14 38, 14 36 C14 34, 20 18, 44 10 C62 4, 88 16, 100 36 C112 56, 138 68, 156 62 C180 54, 186 38, 186 36 C186 34, 180 18, 156 10 C138 4, 112 16, 100 36 Z"
                fill="#14532d"
                opacity="0.18"
                transform="translate(2, 5)"
              />

              {/* Corps principal bas du ruban (ombre) */}
              <path
                d="M100 36 C88 54, 64 66, 44 60 C22 52, 16 38, 16 36 C16 34, 22 20, 44 12 C64 6, 88 18, 100 36 C112 54, 136 66, 156 60 C178 52, 184 38, 184 36 C184 34, 178 20, 156 12 C136 6, 112 18, 100 36 Z"
                fill="url(#g-ribbon-bot)"
                filter="url(#f-glow)"
              />

              {/* Corps principal haut du ruban (lumière) */}
              <path
                d="M100 36 C90 18, 66 6, 46 12 C24 20, 18 34, 18 36 C18 30, 24 16, 46 10 C68 4, 92 18, 100 36 C108 18, 132 4, 154 10 C176 16, 182 30, 182 36 C182 34, 176 20, 154 12 C132 6, 108 18, 100 36 Z"
                fill="url(#g-ribbon-top)"
              />

              {/* Reflet brillant boucle gauche */}
              <path
                d="M56 16 C48 14, 30 18, 24 28 C20 34, 22 24, 34 17 C42 12, 52 13, 56 16 Z"
                fill="url(#g-shine-left)"
                opacity="0.85"
              />

              {/* Reflet brillant boucle droite */}
              <path
                d="M144 16 C152 14, 170 18, 176 28 C180 34, 178 24, 166 17 C158 12, 148 13, 144 16 Z"
                fill="url(#g-shine-right)"
                opacity="0.85"
              />

              {/* Torsion centrale — couche de profondeur */}
              <path
                d="M92 28 C96 32, 100 36, 104 28 C106 24, 100 36, 96 44 C94 40, 92 36, 92 28 Z"
                fill="url(#g-ribbon-mid)"
                opacity="0.7"
              />

              {/* Contour fin pour définir les bords */}
              <path
                d="M100 36 C88 54, 64 66, 44 60 C22 52, 16 38, 16 36 C16 34, 22 20, 44 12 C64 6, 88 18, 100 36 C112 54, 136 66, 156 60 C178 52, 184 38, 184 36 C184 34, 178 20, 156 12 C136 6, 112 18, 100 36 Z"
                stroke="#15803d"
                strokeWidth="0.8"
                fill="none"
                opacity="0.5"
              />
            </svg>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/40 to-primary/60" />
          </div>

          <h1
            id="hero-title"
            className="font-serif text-7xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none milele-title-shadow"
            style={{ letterSpacing: '-0.02em' }}
          >
            Milele
          </h1>

          {/* Ligne décorative sous le titre */}
          <div className="flex items-center gap-3 w-full max-w-sm justify-center">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>

        {/* Main paragraphs */}
        <div className="space-y-8 max-w-3xl mx-auto">
          {/* Phrase de définition — même taille que le texte, en gras */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-lg md:text-xl text-foreground font-bold text-center leading-relaxed">
              {t('hero.heading')}
            </p>
          </div>

          {/* Premier paragraphe avec bordure gauche */}
          <div className={`relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/70 to-primary/30 rounded-full" />
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed pl-6 text-left font-light">
              {t('hero.paragraph1')}
            </p>
          </div>
          
          {/* Second paragraph — Aïon et Aeternum en gras vert */}
          <div className={`relative transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-accent via-accent/70 to-accent/30 rounded-full" />
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed pl-6 text-left font-light">
              {highlightWords(t('hero.paragraph2'), ['Aïon', 'Aeternum'])}
            </p>
          </div>
          
          {/* Closing statement - highlighted */}
          <div className={`transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-serif font-semibold italic">
              {t('hero.closing')}
            </p>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center pt-8 transition-all duration-700 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            size="lg" 
            className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5" 
            asChild
          >
            <Link href="/auth/sign-up">
              {t('hero.button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-base px-8 py-6 hover:bg-primary/5 transition-all duration-300" 
            asChild
          >
            <Link href="/app/memorials">{parseHtmlInText(t('hero.explore'))}</Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`mt-12 transition-all duration-700 delay-1200 ${isVisible ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>

      {/* Feature cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full px-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <FeatureCard
          icon="🛡️"
          title={t('hero.feature1')}
          description={t('hero.feature1Desc')}
          delay={600}
        />
        <FeatureCard
          icon="✨"
          title={t('hero.feature2')}
          description={t('hero.feature2Desc')}
          delay={800}
        />
        <FeatureCard
          icon="🎯"
          title={t('hero.feature3')}
          description={t('hero.feature3Desc')}
          delay={1000}
        />
      </div>
    </section>
  )
}

/**
 * Met en gras et en vert foncé les mots spécifiés dans un texte
 */
function highlightWords(text: string, words: string[]): React.ReactNode {
  if (!text) return text
  const pattern = new RegExp(`(${words.join('|')})`, 'g')
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        words.includes(part)
          ? <strong key={i}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: string
  title: string
  description: string
  delay?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  return (
    <article 
      className={`group flex flex-col items-center text-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border transition-all duration-500 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      tabIndex={0}
      role="article"
      aria-labelledby={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="text-5xl mb-5 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 
        id={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`} 
        className="font-serif font-semibold text-lg mb-3 text-foreground group-hover:text-primary transition-colors duration-300"
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </article>
  )
}

