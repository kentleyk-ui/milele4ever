'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Search, CheckCircle, Info, XCircle, Shield } from 'lucide-react'

interface ReviewItem {
  id: string
  severity: 'critical' | 'warning' | 'note' | 'missing'
  section: string
  clause: string
  risk: string
  suggestedFix: string
}

const RED_FLAGS = [
  '"any and all claims"',
  '"indemnify, defend, and hold harmless"',
  '"sole discretion"',
  '"absolute discretion"',
  '"including but not limited to"',
  '"time is of the essence"',
  '"perpetual"',
  '"irrevocable"',
]

function analyzeContract(text: string, isFr: boolean): { items: ReviewItem[]; summary: string; verdict: string } {
  const items: ReviewItem[] = []
  const lower = text.toLowerCase()

  const hasLiabilityCap = lower.includes('liability cap') || lower.includes('plafond') || lower.includes('capped at') || lower.includes('plafonné')
  const hasIndemnity = lower.includes('indemnif') || lower.includes('hold harmless')
  const hasSoleDiscretion = lower.includes('sole discretion') || lower.includes('seule discrétion')
  const hasAutoRenewal = lower.includes('auto-renew') || lower.includes('renouvellement automatique') || lower.includes('successive')
  const hasIpAssignment = lower.includes('intellectual property') || lower.includes('propriété intellectuelle') || lower.includes('ip assignment')
  const hasCurePeriod = lower.includes('cure period') || lower.includes('délai de remédiation') || lower.includes('30 days') || lower.includes('30 jours')
  const hasGoverningLaw = lower.includes('governing law') || lower.includes('droit applicable')
  const hasLiabilityCarveout = lower.includes('indemnif') && !hasLiabilityCap

  if (hasIndemnity && lower.includes('hold harmless')) {
    items.push({
      id: '1', severity: 'critical', section: '§ Indemnisation',
      clause: '"indemnify, defend, and hold harmless [...] any and all claims"',
      risk: isFr
        ? 'Périmètre d\'indemnisation illimité. La clause "hold harmless" bloque vos recours même si l\'autre partie est fautive.'
        : 'Unlimited indemnity scope. "Hold harmless" blocks your counterclaims even if they caused the loss.',
      suggestedFix: isFr
        ? 'Remplacer par : "réclamations découlant directement de la violation de la Section X." Supprimer "hold harmless".'
        : 'Change to: "claims arising directly from [Party]\'s breach of Section X." Remove "and hold harmless".',
    })
  }

  if (!hasLiabilityCap) {
    items.push({
      id: '2', severity: 'critical', section: '§ Responsabilité',
      clause: isFr ? 'Aucun plafond de responsabilité mentionné.' : 'No liability cap stated.',
      risk: isFr
        ? 'Les tribunaux appliquent une responsabilité illimitée par défaut. Exposition catastrophique possible.'
        : 'Courts default to unlimited liability. Catastrophic exposure possible.',
      suggestedFix: isFr
        ? 'Ajouter : "La responsabilité totale est plafonnée aux honoraires versés au cours des 12 mois précédant la réclamation."'
        : 'Add: "Aggregate liability capped at fees paid in the 12 months preceding the claim."',
    })
  }

  if (hasSoleDiscretion) {
    items.push({
      id: '3', severity: 'warning', section: '§ Discrétion',
      clause: '"sole discretion" / "seule discrétion"',
      risk: isFr
        ? 'Une partie peut agir arbitrairement (bloquer règlements, rejeter livrables) sans justification.'
        : 'One party can act arbitrarily (block settlements, reject deliverables) without justification.',
      suggestedFix: isFr
        ? 'Remplacer par : "accord non refusé déraisonnablement, ni conditionné, ni retardé".'
        : 'Replace with: "consent not to be unreasonably withheld, conditioned, or delayed".',
    })
  }

  if (hasAutoRenewal) {
    items.push({
      id: '4', severity: 'warning', section: '§ Renouvellement',
      clause: isFr ? 'Renouvellement automatique pour des périodes successives.' : 'Auto-renewal for successive terms.',
      risk: isFr
        ? 'La date limite de résiliation est facile à manquer — vous êtes verrouillé pour une autre période.'
        : 'Easy to miss renewal deadline — locked into another term.',
      suggestedFix: isFr
        ? 'Exiger un préavis de 60–90 jours pour la résiliation ; notification par email autorisée.'
        : 'Require 60–90 day opt-out notice; email notice permitted.',
    })
  }

  if (!hasCurePeriod) {
    items.push({
      id: '5', severity: 'warning', section: '§ Résiliation',
      clause: isFr ? 'Pas de délai de remédiation avant résiliation pour manquement.' : 'No cure period before termination for breach.',
      risk: isFr
        ? 'Tout manquement peut entraîner résiliation immédiate — même un retard de paiement mineur.'
        : 'Any breach triggers immediate termination — even a minor payment delay.',
      suggestedFix: isFr
        ? 'Ajouter un délai de remédiation de 30 jours pour tout manquement matériel.'
        : 'Add a 30-day cure period for any material breach.',
    })
  }

  if (hasIpAssignment && !lower.includes('pre-existing') && !lower.includes('préexistant')) {
    items.push({
      id: '6', severity: 'missing', section: '§ Propriété Intellectuelle',
      clause: isFr ? 'Cession de PI sans exclusion des outils préexistants.' : 'IP assignment without pre-existing IP exclusion.',
      risk: isFr
        ? 'Vous pourriez céder involontairement des outils développés avant cet engagement.'
        : 'You may inadvertently assign tools developed before this engagement.',
      suggestedFix: isFr
        ? 'Ajouter : "Le prestataire conserve tous les droits sur sa PI préexistante et ses outils."'
        : 'Add: "Contractor retains all rights to pre-existing IP and tools."',
    })
  }

  if (!hasGoverningLaw) {
    items.push({
      id: '7', severity: 'missing', section: '§ Droit Applicable',
      clause: isFr ? 'Aucun droit applicable ni juridiction mentionnés.' : 'No governing law or jurisdiction specified.',
      risk: isFr
        ? 'En cas de litige, la détermination de la juridiction sera coûteuse et incertaine.'
        : 'Determining jurisdiction in a dispute will be costly and uncertain.',
      suggestedFix: isFr
        ? 'Ajouter une clause de droit applicable et de juridiction.'
        : 'Add a governing law and jurisdiction clause.',
    })
  }

  const criticalCount = items.filter(i => i.severity === 'critical').length
  const warningCount = items.filter(i => i.severity === 'warning').length
  const missingCount = items.filter(i => i.severity === 'missing').length

  const summary = isFr
    ? `Analyse terminée : ${criticalCount} point(s) critique(s), ${warningCount} avertissement(s), ${missingCount} protection(s) manquante(s) détectés.`
    : `Analysis complete: ${criticalCount} critical issue(s), ${warningCount} warning(s), ${missingCount} missing protection(s) detected.`

  const verdict = criticalCount > 0
    ? (isFr ? '⛔ Consulter un avocat avant de signer' : '⛔ Consult Attorney Before Signing')
    : warningCount > 0
    ? (isFr ? '⚠️ Favorable à la contrepartie — Négocier' : '⚠️ Favors Counterparty — Negotiate')
    : (isFr ? '✅ Globalement équilibré' : '✅ Generally Fair')

  return { items, summary, verdict }
}

export default function ContractReviewPage() {
  const { t, language } = useI18n()
  const isFr = language === 'fr'
  const [contractText, setContractText] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewResults, setReviewResults] = useState<ReturnType<typeof analyzeContract> | null>(null)

  const startReview = () => {
    if (!contractText.trim()) return
    setReviewing(true)
    setReviewResults(null)
    setTimeout(() => {
      const results = analyzeContract(contractText, isFr)
      setReviewResults(results)
      setReviewing(false)
    }, 1200)
  }

  const getSeverityConfig = (severity: ReviewItem['severity']) => {
    switch (severity) {
      case 'critical':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' }
      case 'note':
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' }
      case 'missing':
        return { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' }
    }
  }

  const groupedItems = reviewResults
    ? {
        critical: reviewResults.items.filter(i => i.severity === 'critical'),
        warning: reviewResults.items.filter(i => i.severity === 'warning'),
        note: reviewResults.items.filter(i => i.severity === 'note'),
        missing: reviewResults.items.filter(i => i.severity === 'missing'),
      }
    : null

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('review.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('review.subtitle')}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
        {t('review.disclaimer')}
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4 text-primary" />
            {t('review.paste')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={t('review.placeholder')}
            value={contractText}
            onChange={e => setContractText(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <Button onClick={startReview} disabled={reviewing || !contractText.trim()} className="w-full sm:w-auto">
            <Search className="w-4 h-4 mr-2" />
            {reviewing ? t('review.analyzing') : t('review.analyze')}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {!reviewResults && !reviewing && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Search className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">{t('review.empty')}</p>
        </div>
      )}

      {reviewing && (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">{t('review.analyzing')}</span>
        </div>
      )}

      {reviewResults && groupedItems && (
        <div className="space-y-5">
          {/* Summary + verdict */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm">{reviewResults.summary}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm font-semibold">{t('review.overall')} :</span>
                <span className="text-sm font-medium">{reviewResults.verdict}</span>
              </div>
            </CardContent>
          </Card>

          {/* Critical */}
          {groupedItems.critical.length > 0 && (
            <ReviewSection title={t('review.critical')} items={groupedItems.critical} t={t} getSeverityConfig={getSeverityConfig} />
          )}
          {/* Warnings */}
          {groupedItems.warning.length > 0 && (
            <ReviewSection title={t('review.warnings')} items={groupedItems.warning} t={t} getSeverityConfig={getSeverityConfig} />
          )}
          {/* Notes */}
          {groupedItems.note.length > 0 && (
            <ReviewSection title={t('review.notes')} items={groupedItems.note} t={t} getSeverityConfig={getSeverityConfig} />
          )}
          {/* Missing */}
          {groupedItems.missing.length > 0 && (
            <ReviewSection title={t('review.missing')} items={groupedItems.missing} t={t} getSeverityConfig={getSeverityConfig} />
          )}
        </div>
      )}
    </div>
  )
}

function ReviewSection({
  title, items, t, getSeverityConfig,
}: {
  title: string
  items: ReviewItem[]
  t: (k: string, d?: string) => string
  getSeverityConfig: (s: ReviewItem['severity']) => { icon: React.ElementType; color: string; bg: string }
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="space-y-2">
        {items.map(item => {
          const { icon: Icon, color, bg } = getSeverityConfig(item.severity)
          return (
            <div key={item.id} className={`border rounded-lg p-4 space-y-2 ${bg}`}>
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{item.section}</Badge>
                  </div>
                  <code className="text-xs bg-background/60 px-2 py-1 rounded block">{item.clause}</code>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">{t('review.risk')} : </span>
                    <span className="text-xs">{item.risk}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">{t('review.fix')} : </span>
                    <span className="text-xs">{item.suggestedFix}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
