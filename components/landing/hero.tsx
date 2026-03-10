'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TreePine, Heart, MousePointerClick } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function Hero() {
  const { t } = useI18n()
  
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-28 text-center">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
          {t('landing.title', 'Milele')}
        </h1>
        
        <div className="space-y-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          <p className="text-xl md:text-2xl font-medium text-foreground">
            {t('hero.custom1')}
          </p>
          
          <p className="text-lg md:text-xl">
            {t('hero.custom2')}
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground/80 italic leading-relaxed">
            {t('hero.custom3')}
          </p>
          
          <p className="text-lg md:text-xl pt-2">
            {t('hero.custom4')}<br />
            <span className="text-base">{t('common.loading')}</span>
          </p>
          
          <p className="text-sm md:text-base text-muted-foreground/60 pt-2">
            {t('hero.custom5')}
          </p>
          
          <p className="font-serif text-2xl md:text-3xl font-semibold text-primary pt-6">
            {t('hero.custom6')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button size="lg" className="text-base px-8 py-6" asChild>
            <Link href="/auth/sign-up">{t('hero.button')}</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 py-6" asChild>
            <Link href="/auth/login">{t('landing.login')}</Link>
          </Button>
        </div>
        
        {/* Lien temporaire pour presentation */}
        <div className="pt-4">
          <Link 
            href="/app/services/new" 
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            {t('services.title')} (Demo)
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto w-full">
        <FeatureCard
          icon={<TreePine className="h-7 w-7" />}
          title={t('hero.feature1')}
          description={t('hero.feature1Desc')}
        />
        <FeatureCard
          icon={<Heart className="h-7 w-7" />}
          title={t('hero.feature2')}
          description={t('hero.feature2Desc')}
        />
        <FeatureCard
          icon={<MousePointerClick className="h-7 w-7" />}
          title={t('hero.feature3')}
          description={t('hero.feature3Desc')}
        />
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5">
        {icon}
      </div>
      <h3 className="font-serif font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
