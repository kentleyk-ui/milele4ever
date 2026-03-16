'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TreePine, Heart, MousePointerClick, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function Hero() {
  const { t } = useI18n()
  
  return (
    <section id="main-content" className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-28 text-center" role="main" aria-labelledby="hero-title">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 id="hero-title" className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance stagger-item" style={{ animationDelay: '0ms' }}>
          {t('landing.title', 'Milele')}
        </h1>
        
        <div className="space-y-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          <p className="text-xl md:text-2xl font-medium text-foreground stagger-item" style={{ animationDelay: '100ms' }}>
            {t('hero.custom1')}
          </p>
          
          <p className="text-lg md:text-xl stagger-item" style={{ animationDelay: '200ms' }}>
            {t('hero.custom2')}
          </p>
          
          <div className="quote-highlight stagger-item" style={{ animationDelay: '300ms' }}>
            <p className="text-base md:text-lg text-muted-foreground italic leading-relaxed">
              {t('hero.custom3')}
            </p>
          </div>
          
          <p className="text-lg md:text-xl pt-2 stagger-item" style={{ animationDelay: '400ms' }}>
            {t('hero.custom4')}
          </p>
          
          <p className="text-sm md:text-base text-muted-foreground pt-2 stagger-item" style={{ animationDelay: '500ms' }}>
            {t('hero.custom5')}
          </p>
          
          <p className="font-serif text-2xl md:text-3xl font-semibold text-primary pt-6 stagger-item" style={{ animationDelay: '600ms' }}>
            {t('hero.custom6')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 stagger-item" style={{ animationDelay: '700ms' }}>
          <Button size="lg" className="text-base px-8 py-6 btn-ripple focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" asChild>
            <Link href="/auth/sign-up">{t('hero.button')}</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 py-6 btn-ripple focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" asChild>
            <Link href="/auth/login">{t('landing.login')}</Link>
          </Button>
        </div>
        
        {/* Lien temporaire pour presentation */}
        <div className="pt-4 stagger-item" style={{ animationDelay: '800ms' }}>
          <Link 
            href="/app/services/new" 
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            {t('services.title')} (Demo)
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="mt-16 scroll-indicator" aria-hidden="true">
        <ChevronDown className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto w-full">
        <FeatureCard
          icon={<TreePine className="h-7 w-7" />}
          title={t('hero.feature1')}
          description={t('hero.feature1Desc')}
          delay={900}
        />
        <FeatureCard
          icon={<Heart className="h-7 w-7" />}
          title={t('hero.feature2')}
          description={t('hero.feature2Desc')}
          delay={1000}
        />
        <FeatureCard
          icon={<MousePointerClick className="h-7 w-7" />}
          title={t('hero.feature3')}
          description={t('hero.feature3Desc')}
          delay={1100}
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
  return (
    <article 
      className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/50 card-hover stagger-item focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      style={{ animationDelay: `${delay}ms` }}
      tabIndex={0}
      role="article"
      aria-labelledby={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary mb-5 icon-float">
        {icon}
      </div>
      <h3 id={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`} className="font-serif font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </article>
  )
}
