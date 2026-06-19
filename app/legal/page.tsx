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
} from 'lucide-react'

const recentDocuments = [
  { id: '1', title: 'NDA - TechCorp', type: 'NDA Mutuel', status: 'completed', date: '2025-06-08' },
  { id: '2', title: 'Contrat de Service - Freelance', type: 'Service Agreement', status: 'draft', date: '2025-06-07' },
  { id: '3', title: 'Contract Review - SaaS', type: 'Révision', status: 'reviewed', date: '2025-06-05' },
]

export default function LegalDashboard() {
  const { t } = useI18n()

  const stats = [
    { label: t('dashboard.totalDocs'), value: '12', icon: FileText },
    { label: t('dashboard.drafts'), value: '5', icon: Scale },
    { label: t('dashboard.reviewed'), value: '4', icon: FileCheck },
    { label: t('dashboard.completed'), value: '3', icon: CheckCircle },
  ]

  const quickActions = [
    { label: t('type.mutualNda'), href: '/legal/contracts', icon: Shield, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: t('type.serviceAgreement'), href: '/legal/contracts', icon: FileText, color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    { label: t('nav.review'), href: '/legal/review', icon: Search, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: t('nav.dueDiligence'), href: '/legal/due-diligence', icon: ClipboardCheck, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  ]

  const tools = [
    {
      href: '/legal/contracts',
      icon: FileText,
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: t('nav.contracts'),
      desc: t('contracts.subtitle'),
    },
    {
      href: '/legal/review',
      icon: Search,
      color: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: t('nav.review'),
      desc: t('review.subtitle'),
    },
    {
      href: '/legal/due-diligence',
      icon: ClipboardCheck,
      color: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: t('nav.dueDiligence'),
      desc: t('dd.subtitle'),
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 border-0">{t('status.completed')}</Badge>
      case 'draft':
        return <Badge variant="secondary">{t('status.draft')}</Badge>
      case 'reviewed':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-0">{t('status.reviewed')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href + action.label} href={action.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('dashboard.recentDocs')}</h2>
          <Link
            href="/legal/contracts"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1 text-xs')}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t('dashboard.noDocuments')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} · {doc.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {getStatusBadge(doc.status)}
                      <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tools */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">{t('dashboard.tools')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className={`p-2.5 rounded-lg ${tool.color} w-fit`}>
                    <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{tool.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
