'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
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
        <div className="absolute top-20 left-10 w-72 h-72 bg-sage-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-sage-500/3 to-transparent rounded-full" />
      </div>

      <div className={`max-w-4xl mx-auto space-y-12 relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Main Title */}
        <div className="space-y-6">
          <h1 
            id="hero-title" 
            className="font-serif text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl text-balance text-sage-900"
          >
            {t('hero.heading')}
          </h1>
        </div>
        
        {/* Main paragraphs with elegant styling */}
        <div className="space-y-8 max-w-3xl mx-auto">
          {/* First paragraph with left border */}
          <div className={`relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-sage-400 via-sage-400 to-sage-200 rounded-full" />
            <p className="text-lg md:text-xl text-sage-800 leading-relaxed pl-6 text-left font-light">
              {t('hero.paragraph1')}
            </p>
          </div>
          
          {/* Second paragraph with different border */}
          <div className={`relative transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-400 via-gold-300 to-gold-200 rounded-full" />
            <p className="text-lg md:text-xl text-sage-800 leading-relaxed pl-6 text-left font-light">
              {t('hero.paragraph2')}
            </p>
          </div>
          
          {/* Closing statement - highlighted */}
          <div className={`transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-lg md:text-xl text-sage-700 leading-relaxed font-serif font-semibold italic">
              {t('hero.closing')}
            </p>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center pt-8 transition-all duration-700 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            size="lg" 
            className="text-base px-8 py-6 shadow-lg shadow-sage-600/20 hover:shadow-xl hover:shadow-sage-600/30 transition-all duration-300 hover:-translate-y-0.5 bg-sage-600 hover:bg-sage-700 text-white" 
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
            className="text-base px-8 py-6 hover:bg-sage-50 transition-all duration-300 border-sage-300 text-sage-700" 
            asChild
          >
            <Link href="/app/memorials">{t('hero.explore')}</Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`mt-12 transition-all duration-700 delay-1200 ${isVisible ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
        <div className="flex flex-col items-center gap-2 text-sage-600">
          <span className="text-xs uppercase tracking-wider">Scroll to discover</span>
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
      className={`group flex flex-col items-center text-center p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-sage-200 transition-all duration-500 hover:shadow-lg hover:shadow-sage-200/50 hover:-translate-y-1 hover:border-sage-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      tabIndex={0}
      role="article"
      aria-labelledby={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="text-5xl mb-5 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 
        id={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`} 
        className="font-serif font-semibold text-lg mb-3 text-sage-900 group-hover:text-sage-700 transition-colors duration-300"
      >
        {title}
      </h3>
      <p className="text-sm text-sage-600 leading-relaxed">{description}</p>
    </article>
  )
}

