'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Heart, Clock, ChevronDown, Calculator } from "lucide-react"
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
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
      </div>

      <div className={`max-w-4xl mx-auto space-y-12 relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Main Title with floating animation */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>{t('hero.intro.meaning')}</span>
          </div>
          
          <h1 
            id="hero-title" 
            className="font-serif text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-balance bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text"
            style={{ 
              animationDelay: '200ms',
              textShadow: '0 4px 30px rgba(var(--primary), 0.1)'
            }}
          >
            {t('hero.intro.title')}
          </h1>
        </div>
        
        {/* Intro paragraphs with staggered animation */}
        <div className="space-y-8 max-w-3xl mx-auto">
          <p 
            className={`text-lg md:text-xl text-foreground/90 leading-relaxed font-medium transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {t('hero.intro.paragraph1')}
          </p>
          
          <div className={`relative transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed pl-6 text-left">
              {t('hero.intro.paragraph2')}
            </p>
          </div>
          
          <p 
            className={`text-base md:text-lg text-muted-foreground leading-relaxed italic transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {t('hero.intro.paragraph3')}
          </p>
        </div>
        
        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center pt-4 transition-all duration-700 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            size="lg" 
            className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5" 
            asChild
          >
            <Link href="/auth/sign-up">{t('hero.button')}</Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-base px-8 py-6 hover:bg-primary/5 transition-all duration-300" 
            asChild
          >
            <Link href="/auth/login">{t('landing.login')}</Link>
          </Button>
        </div>
        
        {/* Simulator link */}
        <div className={`transition-all duration-700 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Button size="lg" variant="ghost" className="gap-2 text-primary hover:text-primary/80 group" asChild>
            <Link href="/simulator">
              <Calculator className="w-5 h-5 transition-transform group-hover:scale-110" />
              {t('simulator.cta', 'Simuler mes besoins')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`mt-12 transition-all duration-700 delay-1200 ${isVisible ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs uppercase tracking-wider">Découvrir</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>

      {/* Feature cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto w-full px-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <FeatureCard
          icon={<Sparkles className="h-6 w-6" />}
          title={t('hero.feature1')}
          description={t('hero.feature1Desc')}
          delay={600}
        />
        <FeatureCard
          icon={<Heart className="h-6 w-6" />}
          title={t('hero.feature2')}
          description={t('hero.feature2Desc')}
          delay={800}
        />
        <FeatureCard
          icon={<Clock className="h-6 w-6" />}
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
  icon: React.ReactNode
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
      className={`group flex flex-col items-center text-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      tabIndex={0}
      role="article"
      aria-labelledby={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
      <h3 
        id={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`} 
        className="font-serif font-semibold text-lg mb-3 group-hover:text-primary transition-colors duration-300"
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </article>
  )
}
