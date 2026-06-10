'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Search, CheckCircle, Info, XCircle } from 'lucide-react'

interface ReviewItem {
  id: string
  severity: 'critical' | 'warning' | 'note' | 'missing'
  section: string
  clause: string
  risk: string
  suggestedFix: string
}

export default function ContractReviewPage() {
  const { t } = useI18n()
  const [contractText, setContractText] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewResults, setReviewResults] = useState<ReviewItem[] | null>(null)

  const demoReviewResults: ReviewItem[] = [
    {
      id: '1',
      severity: 'critical',
      section: '§8.3',
      clause: 'You shall indemnify, defend, and hold harmless the Company from any and all claims.',
      risk: 'Unlimited indemnity scope. "Hold harmless" blocks your counterclaims even if they caused the loss.',
      suggestedFix: 'Change to "claims arising directly from your breach of Section X." Remove "and hold harmless".',
    },
    {
      id: '2',
      severity: 'critical',
      section: '§10.1',
      clause: 'No liability cap is stated in this agreement.',
      risk: 'Courts default to unlimited liability. You could face catastrophic exposure.',
      suggestedFix: 'Add: "Aggregate liability capped at fees paid in the 12 months preceding the claim."',
    },
    {
      id: '3',
      severity: 'warning',
      section: '§3.2',
      clause: 'The Company may terminate this agreement at its sole discretion with 30 days notice.',
      risk: 'One party can act arbitrarily. No cure period for breach.',
      suggestedFix: 'Change to "for material breach after 30-day cure period." Or add kill fee.',
    },
    {
      id: '4',
      severity: 'warning',
      section: '§6.4',
      clause: 'Payment terms: Net 60 days after invoice.',
      risk: 'Long payment cycle creates cash flow risk.',
      suggestedFix: 'Negotiate Net 30 or better.',
    },
    {
      id: '5',
      severity: 'note',
      section: '§12.1',
      clause: 'Auto-renewal for successive one-year terms.',
      risk: 'Easy to miss renewal deadline.',
      suggestedFix: 'Ensure 60-day opt-out notice window.',
    },
    {
      id: '6',
      severity: 'missing',
      section: 'N/A',
      clause: 'No IP assignment clause excluding pre-existing tools.',
      risk: 'You may inadvertently assign tools you developed before this engagement.',
      suggestedFix: 'Add: "Contractor retains all rights to pre-existing IP and tools."',
    },
  ]

  const startReview = () => {
    if (!contractText.trim()) return
    setReviewing(true)
    // Simulate AI review
    setTimeout(() => {
      setReviewResults(demoReviewResults)
      setReviewing(false)
    }, 2000)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="default" className="bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            Critical
          </Badge>
        )
      case 'warning':
        return (
          <Badge variant="default" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 gap-1">
            <AlertTriangle className="w-3 h-3" />
            Warning
          </Badge>
        )
      case 'note':
        return (
          <Badge variant="default" className="bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30 gap-1">
            <Info className="w-3 h-3" />
            Note
          </Badge>
        )
      case 'missing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="w-3 h-3" />
            Missing
          </Badge>
        )
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'note': return <Info className="w-5 h-5 text-blue-500" />
      case 'missing': return <Info className="w-5 h-5 text-muted-foreground" />
    }
  }

  const groupedResults = {
    critical: reviewResults?.filter(r => r.severity === 'critical') || [],
    warning: reviewResults?.filter(r => r.severity === 'warning') || [],
    note: reviewResults?.filter(r => r.severity === 'note') || [],
    missing: reviewResults?.filter(r => r.severity === 'missing') || [],
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t('legal.review')}</h1>
        <p className="text-muted-foreground">{t('legal.reviewContract')}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <strong>NOT LEGAL ADVICE</strong> — for informational purposes only. Consult an attorney before signing.
      </div>

      {!reviewResults ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('legal.reviewPaste')}</label>
              <Textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder={t('legal.reviewPlaceholder')}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={startReview}
                disabled={!contractText.trim() || reviewing}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                {reviewing ? 'Analyzing...' : t('legal.startReview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{groupedResults.critical.length}</p>
                  <p className="text-xs text-muted-foreground">{t('legal.critical')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{groupedResults.warning.length}</p>
                  <p className="text-xs text-muted-foreground">{t('legal.warnings')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{groupedResults.note.length}</p>
                  <p className="text-xs text-muted-foreground">{t('legal.notes')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{groupedResults.missing.length}</p>
                  <p className="text-xs text-muted-foreground">{t('legal.missing')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Assessment */}
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-semibold text-foreground">{t('legal.overall')}</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{t('legal.consultAttorney')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results by Category */}
          <div className="space-y-4">
            {/* Critical */}
            {groupedResults.critical.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  {t('legal.critical')}
                </h3>
                {groupedResults.critical.map((item) => (
                  <Card key={item.id} className="border-red-200 dark:border-red-800">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        <span className="text-sm font-mono text-muted-foreground">{item.section}</span>
                      </div>
                      <blockquote className="border-l-2 border-red-400 pl-3 text-sm italic text-foreground">
                        "{item.clause}"
                      </blockquote>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-600">{t('legal.risk')}:</p>
                        <p className="text-sm text-muted-foreground">{item.risk}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('legal.suggestedFix')}:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{item.suggestedFix}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Warnings */}
            {groupedResults.warning.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t('legal.warnings')}
                </h3>
                {groupedResults.warning.map((item) => (
                  <Card key={item.id} className="border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        <span className="text-sm font-mono text-muted-foreground">{item.section}</span>
                      </div>
                      <blockquote className="border-l-2 border-amber-400 pl-3 text-sm italic text-foreground">
                        "{item.clause}"
                      </blockquote>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-600">{t('legal.risk')}:</p>
                        <p className="text-sm text-muted-foreground">{item.risk}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('legal.suggestedFix')}:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{item.suggestedFix}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Notes */}
            {groupedResults.note.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  {t('legal.notes')}
                </h3>
                {groupedResults.note.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        <span className="text-sm font-mono text-muted-foreground">{item.section}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.risk}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Missing */}
            {groupedResults.missing.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  {t('legal.missing')}
                </h3>
                {groupedResults.missing.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(item.severity)}
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.clause}</p>
                      <p className="text-sm text-muted-foreground">{item.risk}</p>
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{item.suggestedFix}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Restart */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setReviewResults(null)
                setContractText('')
              }}
            >
              {t('common.cancel')} / {t('legal.startReview')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
