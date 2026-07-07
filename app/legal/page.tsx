'use client'

import { useI18n } from '@/lib/i18n/context'
import { buttonVariants } from '@/components/ui/button'
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
  TrendingUp,
} from 'lucide-react'

const recentDocuments = [
  { id: '1', title: 'NDA - TechCorp', type: 'NDA Mutuel', status: 'completed', date: '2025-06-08' },
  { id: '2', title: 'Contrat de Service - Freelance', type: 'Service Agreement', status: 'draft', date: '2025-06-07' },
  { id: '3', title: 'Contract Review - SaaS', type: 'Révision', status: 'reviewed', date: '2025-06-05' },
]

export default function LegalDashboard() {
  const { t } = useI18n()

  const stats = [
    {
      label: t('dashboard.totalDocs'),
      value: '12',
      icon: FileText,
      glass: 'glass-cyan',
      textColor: 'text-cyan-300',
      sub: '+2 ce mois',
    },
    {
      label: t('dashboard.drafts'),
      value: '5',
      icon: Scale,
      glass: 'glass-violet',
      textColor: 'text-violet-300',
      sub: '3 en attente',
    },
    {
      label: t('dashboard.reviewed'),
      value: '4',
      icon: FileCheck,
      glass: 'glass-amber',
      textColor: 'text-amber-300',
      sub: '↑ 1 depuis hier',
    },
    {
      label: t('dashboard.completed'),
      value: '3',
      icon: CheckCircle,
      glass: 'glass-emerald',
      textColor: 'text-emerald-300',
      sub: '100% validés',
    },
  ]

  const quickActions = [
    { label: t('type.mutualNda'), href: '/legal/contracts', icon: Shield, glass: 'glass-cyan', text: 'text-cyan-300' },
    { label: t('type.serviceAgreement'), href: '/legal/contracts', icon: FileText, glass: 'glass-emerald', text: 'text-emerald-300' },
    { label: t('nav.review'), href: '/legal/review', icon: Search, glass: 'glass-amber', text: 'text-amber-300' },
    { label: t('nav.dueDiligence'), href: '/legal/due-diligence', icon: ClipboardCheck, glass: 'glass-violet', text: 'text-violet-300' },
  ]

  const tools = [
    {
      href: '/legal/contracts',
      icon: FileText,
      glass: 'glass-cyan',
      text: 'text-cyan-300',
      title: t('nav.contracts'),
      desc: t('contracts.subtitle'),
      tag: 'NDA · Service · LOI',
    },
    {
      href: '/legal/review',
      icon: Search,
      glass: 'glass-amber',
      text: 'text-amber-300',
      title: t('nav.review'),
      desc: t('review.subtitle'),
      tag: 'Risk Analysis',
    },
    {
      href: '/legal/due-diligence',
      icon: ClipboardCheck,
      glass: 'glass-violet',
      text: 'text-violet-300',
      title: t('nav.dueDiligence'),
      desc: t('dd.subtitle'),
      tag: 'M&A · 57 items',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider glass-emerald text-emerald-300 border-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow inline-block" />
            {t('status.completed')}
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider glass text-foreground/70">
            {t('status.draft')}
          </span>
        )
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider glass-amber text-amber-300 border-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-glow inline-block" />
            {t('status.reviewed')}
          </span>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-10">

      {/* ── Header ── */}
      <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0ms' }}>
        {/* Grand titre métallique */}
        <h1 className="logo-metallic font-black uppercase leading-none tracking-[0.08em] select-none"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}>
          Aurea Clavis
        </h1>
        {/* Sous-titre discret */}
        <div className="flex items-center gap-2">
          <div className="h-px w-6 bg-gradient-to-r from-transparent to-cyan-500/50" />
          <p className="text-xs font-mono tracking-[0.22em] text-cyan-400/50 uppercase">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              'relative rounded-xl p-4 glass-hover liquid-hover',
              stat.glass
            )}
            style={{ animationDelay: `${60 + i * 60}ms` }}
          >
            {/* top-right icon faded */}
            <stat.icon className={cn('absolute top-3 right-3 w-8 h-8 opacity-10', stat.textColor)} strokeWidth={1} />

            <div className="relative z-10 space-y-1.5">
              <p className="text-xs font-mono tracking-wider text-white/40 uppercase leading-none">
                {stat.label}
              </p>
              <p className={cn('text-4xl font-bold font-mono tabular-nums leading-none', stat.textColor)}>
                {stat.value}
              </p>
              <p className="text-xs text-white/30 font-mono flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="space-y-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <p className="text-xs font-mono tracking-[0.18em] text-white/25 uppercase">
          ▸ {t('dashboard.quickActions')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                'relative flex flex-col items-center gap-3 p-5 rounded-xl text-center glass-hover liquid-hover cursor-pointer',
                action.glass
              )}
            >
              <action.icon className={cn('w-6 h-6 relative z-10', action.text)} />
              <span className={cn('text-xs font-mono font-medium tracking-wide relative z-10', action.text)}>
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Documents ── */}
      <div className="space-y-3 animate-fade-up" style={{ animationDelay: '380ms' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono tracking-[0.18em] text-white/25 uppercase">
            ▸ {t('dashboard.recentDocs')}
          </p>
          <Link
            href="/legal/contracts"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400/60 hover:text-cyan-300 hover:bg-transparent px-0'
            )}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-xl overflow-hidden glass divide-y divide-white/5">
          {recentDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors group cursor-pointer liquid-hover"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg glass-cyan flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-cyan-300 transition-colors text-white/80">
                    {doc.title}
                  </p>
                  <p className="text-xs text-white/25 font-mono">{doc.type} · {doc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {getStatusBadge(doc.status)}
                <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-cyan-400 transition-all group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tools ── */}
      <div className="space-y-3 animate-fade-up" style={{ animationDelay: '460ms' }}>
        <p className="text-xs font-mono tracking-[0.18em] text-white/25 uppercase">
          ▸ {t('dashboard.tools')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                'group relative flex flex-col p-5 rounded-xl glass-hover liquid-hover',
                tool.glass
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-2.5 rounded-lg glass flex items-center justify-center')}>
                  <tool.icon className={cn('w-4.5 h-4.5', tool.text)} />
                </div>
                <span className="text-[10px] font-mono text-white/25 text-right leading-relaxed">
                  {tool.tag.replace(' · ', '\n')}
                </span>
              </div>
              <h3 className={cn('font-semibold text-sm mb-1.5', tool.text)}>{tool.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed flex-1">{tool.desc}</p>
              <div className={cn('flex items-center gap-1 mt-4 text-xs font-mono group-hover:gap-2 transition-all', tool.text, 'opacity-50 group-hover:opacity-100')}>
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
