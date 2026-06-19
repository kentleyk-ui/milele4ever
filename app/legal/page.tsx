'use client'

import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  FileText,
  Search,
  Shield,
  ClipboardCheck,
  FileCheck,
  CheckCircle,
  Scale,
  ArrowRight,
  Zap,
} from 'lucide-react'

const recentDocuments = [
  { id: '1', title: 'NDA - TechCorp', type: 'NDA Mutuel', status: 'completed', date: '2025-06-08' },
  { id: '2', title: 'Contrat de Service - Freelance', type: 'Service Agreement', status: 'draft', date: '2025-06-07' },
  { id: '3', title: 'Contract Review - SaaS', type: 'Révision', status: 'reviewed', date: '2025-06-05' },
]

export default function LegalDashboard() {
  const { t } = useI18n()

  const stats = [
    { label: t('dashboard.totalDocs'), value: '12', icon: FileText, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: t('dashboard.drafts'), value: '5', icon: Scale, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: t('dashboard.reviewed'), value: '4', icon: FileCheck, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: t('dashboard.completed'), value: '3', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ]

  const quickActions = [
    { label: t('type.mutualNda'), href: '/legal/contracts', icon: Shield, accent: 'text-primary border-primary/25 hover:border-primary/50 hover:bg-primary/8' },
    { label: t('type.serviceAgreement'), href: '/legal/contracts', icon: FileText, accent: 'text-emerald-400 border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-500/8' },
    { label: t('nav.review'), href: '/legal/review', icon: Search, accent: 'text-amber-400 border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/8' },
    { label: t('nav.dueDiligence'), href: '/legal/due-diligence', icon: ClipboardCheck, accent: 'text-violet-400 border-violet-500/25 hover:border-violet-500/50 hover:bg-violet-500/8' },
  ]

  const tools = [
    {
      href: '/legal/contracts',
      icon: FileText,
      color: 'text-primary',
      glow: 'group-hover:shadow-[0_0_20px_oklch(0.78_0.20_200/0.15)]',
      border: 'hover:border-primary/30',
      title: t('nav.contracts'),
      desc: t('contracts.subtitle'),
      tag: 'NDA · Service · LOI',
    },
    {
      href: '/legal/review',
      icon: Search,
      color: 'text-amber-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(251,191,36,0.1)]',
      border: 'hover:border-amber-500/30',
      title: t('nav.review'),
      desc: t('review.subtitle'),
      tag: 'Risk Analysis',
    },
    {
      href: '/legal/due-diligence',
      icon: ClipboardCheck,
      color: 'text-violet-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(167,139,250,0.1)]',
      border: 'hover:border-violet-500/30',
      title: t('nav.dueDiligence'),
      desc: t('dd.subtitle'),
      tag: 'M&A · 57 items',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 text-xs font-mono tracking-wider">
            {t('status.completed')}
          </Badge>
        )
      case 'draft':
        return (
          <Badge className="bg-muted/80 text-muted-foreground border border-border text-xs font-mono tracking-wider">
            {t('status.draft')}
          </Badge>
        )
      case 'reviewed':
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 text-xs font-mono tracking-wider">
            {t('status.reviewed')}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-1 animate-fade-up">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-primary/70 uppercase mb-2">
          <Zap className="w-3 h-3" />
          <span>LexDraft / Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          {t('dashboard.title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-lg border p-4 bg-card flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] animate-fade-up',
              stat.bg
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={cn('p-2 rounded-md border', stat.bg, 'shrink-0')}>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <div>
              <p className={cn('text-2xl font-bold font-mono', stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
          ▸ {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                'group relative flex flex-col items-center gap-3 p-4 rounded-lg border bg-card text-center transition-all duration-200 hover:scale-[1.02] overflow-hidden',
                action.accent
              )}
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <action.icon className={cn('w-5 h-5 relative z-10', action.accent.split(' ')[0])} />
              <span className="text-xs font-medium relative z-10">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
            ▸ {t('dashboard.recentDocs')}
          </h2>
          <Link
            href="/legal/contracts"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1.5 text-xs font-mono uppercase tracking-wider text-primary/70 hover:text-primary hover:bg-primary/8 border border-transparent hover:border-primary/20'
            )}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
          {recentDocuments.map((doc, i) => (
            <div
              key={doc.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors group cursor-pointer',
                i < recentDocuments.length - 1 && 'border-b border-border/40'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-md border border-border/50 bg-primary/8 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                  <FileText className="w-3.5 h-3.5 text-primary/70" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{doc.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{doc.type} · {doc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {getStatusBadge(doc.status)}
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
          ▸ {t('dashboard.tools')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tools.map((tool, i) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                'group relative flex flex-col p-5 rounded-lg border border-border/50 bg-card transition-all duration-300 hover:scale-[1.01] overflow-hidden animate-fade-up',
                tool.border,
                tool.glow
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-md border border-border/50 bg-background/50 group-hover:border-current/30 transition-colors">
                  <tool.icon className={cn('w-4 h-4', tool.color)} />
                </div>
                <span className="text-xs font-mono text-muted-foreground/50 border border-border/30 rounded px-1.5 py-0.5">
                  {tool.tag}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{tool.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{tool.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-mono text-muted-foreground/40 group-hover:text-primary transition-colors">
                <span>Accéder</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
