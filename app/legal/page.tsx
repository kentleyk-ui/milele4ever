'use client'

import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText,
  Search,
  Shield,
  ClipboardCheck,
  Plus,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Scale,
  ArrowRight,
} from 'lucide-react'

export default function LegalDashboard() {
  const { t } = useI18n()

  // Demo data
  const recentDocuments = [
    { id: '1', title: 'NDA - TechCorp', type: 'NDA', status: 'completed', date: '2025-06-08' },
    { id: '2', title: 'Service Agreement - Freelance', type: 'Service Agreement', status: 'draft', date: '2025-06-07' },
    { id: '3', title: 'Contract Review - SaaS', type: 'Review', status: 'reviewed', date: '2025-06-05' },
  ]

  const stats = [
    { label: t('legal.totalDocuments'), value: '12', icon: FileText },
    { label: t('legal.draftCount'), value: '5', icon: Scale },
    { label: t('legal.reviewedCount'), value: '4', icon: FileCheck },
    { label: t('legal.completedCount'), value: '3', icon: CheckCircle },
  ]

  const quickActions = [
    { label: t('legal.newNda'), href: '/legal/contracts', icon: Shield, color: 'bg-blue-500/10 text-blue-600' },
    { label: t('legal.newService'), href: '/legal/contracts', icon: FileText, color: 'bg-green-500/10 text-green-600' },
    { label: t('legal.newReview'), href: '/legal/review', icon: Search, color: 'bg-amber-500/10 text-amber-600' },
    { label: t('legal.newDdRoom'), href: '/legal/due-diligence', icon: ClipboardCheck, color: 'bg-purple-500/10 text-purple-600' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30">{t('legal.completedCount')}</Badge>
      case 'draft':
        return <Badge variant="secondary">{t('legal.draftCount')}</Badge>
      case 'reviewed':
        return <Badge variant="default" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30">{t('legal.reviewedCount')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t('legal.title')}</h1>
        <p className="text-muted-foreground">{t('legal.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('legal.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('legal.recentDocuments')}</h2>
          <Link href="/legal/contracts">
            <Button variant="ghost" size="sm" className="gap-1">
              {t('app.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>{t('legal.noDocuments')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tools Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('legal.tools')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/legal/contracts">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-5 space-y-2">
                <div className="p-2 rounded-lg bg-blue-500/10 w-fit">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">{t('legal.contracts')}</h3>
                <p className="text-sm text-muted-foreground">{t('legal.draftContract')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/legal/review">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-5 space-y-2">
                <div className="p-2 rounded-lg bg-amber-500/10 w-fit">
                  <Search className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-foreground">{t('legal.review')}</h3>
                <p className="text-sm text-muted-foreground">{t('legal.reviewContract')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/legal/due-diligence">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-5 space-y-2">
                <div className="p-2 rounded-lg bg-purple-500/10 w-fit">
                  <ClipboardCheck className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground">{t('legal.dueDiligence')}</h3>
                <p className="text-sm text-muted-foreground">{t('legal.ddRoom')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
