'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollText, Eye, Copy, Check, Download } from 'lucide-react'

interface TermsForm {
  companyName: string
  legalName: string
  country: string
  email: string
  serviceDescription: string
  hasPaidPlans: boolean
  minAge: string
}

function generateTerms(form: TermsForm, isFr: boolean): string {
  const year = new Date().getFullYear()
  const date = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const company = form.companyName || (isFr ? '[Nom de l\'entreprise]' : '[Company Name]')
  const legal = form.legalName || company
  const country = form.country || (isFr ? '[Pays]' : '[Country]')
  const email = form.email || `legal@${company.toLowerCase()}.com`
  const minAge = form.minAge || '18'
  const svcDesc = form.serviceDescription || (isFr ? 'plateforme de gestion de documents juridiques' : 'legal document management platform')

  if (isFr) {
    return `# Conditions d'Utilisation

**${company}**
*Dernière mise à jour : ${date}*

---

> ⚠️ Ce document est un modèle informatif. Consultez un avocat pour votre situation spécifique.

---

## 1. Acceptation des Conditions

En accédant ou en utilisant les services de **${company}**, vous acceptez d'être lié par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

---

## 2. Description du Service

**${company}** est une ${svcDesc}. Nos services sont fournis « en l'état » et nous nous réservons le droit de les modifier à tout moment.

> ⚠️ **Avertissement :** ${company} fournit des modèles et outils informatifs uniquement. Cela ne constitue PAS un avis juridique. Consultez toujours un avocat qualifié pour vos affaires juridiques spécifiques.

---

## 3. Inscription au Compte

- Vous devez avoir au moins **${minAge} ans** pour utiliser nos services
- Vous devez fournir des informations exactes et à jour lors de l'inscription
- Vous êtes responsable de la sécurité de vos identifiants
- Vous devez nous notifier immédiatement de tout accès non autorisé

---

## 4. Utilisation Acceptable

Vous vous engagez à ne pas :
- Utiliser nos services à des fins frauduleuses ou illégales
- Tenter de pirater, perturber ou accéder sans autorisation à notre infrastructure
- Scraper, copier ou redistribuer notre contenu sans autorisation
- Usurper l'identité d'une autre personne ou organisation
- Violer les droits de propriété intellectuelle de tiers

---

## 5. Propriété des Données Utilisateur

Vous êtes propriétaire de vos données. En utilisant nos services, vous nous accordez une licence limitée, non exclusive, pour stocker et traiter vos données dans le seul but de vous fournir les services.

---

## 6. Propriété Intellectuelle

La marque **${company}**, notre interface, notre code et nos contenus originaux sont la propriété exclusive de **${legal}**. Aucun transfert de droits n'est consenti par ces présentes Conditions.

---

${form.hasPaidPlans ? `## 7. Plans Payants et Facturation

- Les frais d'abonnement sont facturés selon le cycle choisi (mensuel ou annuel)
- Les abonnements se renouvellent automatiquement sauf résiliation avant la date de renouvellement
- Les remboursements sont accordés à notre discrétion pour les défauts de service prouvés
- En cas de non-paiement, nous nous réservons le droit de suspendre l'accès

---

## 8. Limitation de Responsabilité

` : `## 7. Limitation de Responsabilité

`}La responsabilité totale de **${company}** envers vous, quelle qu'en soit la cause, est **plafonnée aux frais versés au cours des 12 derniers mois** (ou 100 € si aucun paiement). Nous ne serons pas responsables des dommages indirects, consécutifs, perte de profits ou perte de données.

---

## ${form.hasPaidPlans ? '9' : '8'}. Disponibilité du Service

Nous nous efforçons de maintenir nos services disponibles, mais nous ne garantissons pas de disponibilité (uptime) minimum sauf SLA spécifique. Des interruptions de maintenance peuvent survenir avec ou sans préavis.

---

## ${form.hasPaidPlans ? '10' : '9'}. Résiliation

- Vous pouvez supprimer votre compte à tout moment depuis votre espace personnel
- Nous pouvons suspendre ou résilier votre compte en cas de violation de ces Conditions
- Après résiliation, vos données seront supprimées dans un délai de **90 jours**

---

## ${form.hasPaidPlans ? '11' : '10'}. Modifications des Conditions

Nous vous informerons de toute modification matérielle avec un préavis de **15 jours** par email. L'utilisation continue du service après ce délai vaut acceptation des nouvelles conditions.

---

## ${form.hasPaidPlans ? '12' : '11'}. Droit Applicable

Les présentes Conditions sont régies par le droit de **${country}**. Tout litige sera soumis à la juridiction des tribunaux compétents de **${country}**.

---

## ${form.hasPaidPlans ? '13' : '12'}. Contact

Pour toute question relative aux présentes Conditions : **${email}**

---

*© ${year} ${legal}. Tous droits réservés.*
`
  }

  return `# Terms of Service

**${company}**
*Last updated: ${date}*

---

> ⚠️ This document is an informational template. Consult an attorney for your specific situation.

---

## 1. Acceptance of Terms

By accessing or using **${company}** services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.

---

## 2. Service Description

**${company}** is a ${svcDesc}. Our services are provided "as is" and we reserve the right to modify them at any time.

> ⚠️ **Disclaimer:** ${company} provides informational templates and tools only. This does NOT constitute legal advice. Always consult a qualified attorney for specific legal matters.

---

## 3. Account Registration

- You must be at least **${minAge} years old** to use our services
- You must provide accurate and current information upon registration
- You are responsible for the security of your credentials
- You must notify us immediately of any unauthorized access

---

## 4. Acceptable Use

You agree not to:
- Use our services for fraudulent or illegal purposes
- Attempt to hack, disrupt, or gain unauthorized access to our infrastructure
- Scrape, copy, or redistribute our content without authorization
- Impersonate another person or organization
- Violate third-party intellectual property rights

---

## 5. User Data Ownership

You own your data. By using our services, you grant us a limited, non-exclusive license to store and process your data solely to provide the services to you.

---

## 6. Intellectual Property

The **${company}** brand, interface, code, and original content are the exclusive property of **${legal}**. No transfer of rights is made under these Terms.

---

${form.hasPaidPlans ? `## 7. Paid Plans and Billing

- Subscription fees are billed on your chosen cycle (monthly or annual)
- Subscriptions auto-renew unless cancelled before the renewal date
- Refunds are granted at our discretion for proven service defects
- Non-payment may result in service suspension

---

## 8. Limitation of Liability

` : `## 7. Limitation of Liability

`}**${company}**'s total liability to you, regardless of cause, is **capped at fees paid in the last 12 months** (or $100 if no payment). We shall not be liable for indirect, consequential damages, lost profits, or data loss.

---

## ${form.hasPaidPlans ? '9' : '8'}. Service Availability

We strive to keep our services available, but we do not guarantee minimum uptime unless a specific SLA applies. Maintenance interruptions may occur with or without notice.

---

## ${form.hasPaidPlans ? '10' : '9'}. Termination

- You may delete your account at any time from your account settings
- We may suspend or terminate your account for violations of these Terms
- After termination, your data will be deleted within **90 days**

---

## ${form.hasPaidPlans ? '11' : '10'}. Changes to Terms

We will notify you of any material changes with **15 days** advance notice by email. Continued use after this period constitutes acceptance of the updated terms.

---

## ${form.hasPaidPlans ? '12' : '11'}. Governing Law

These Terms are governed by the laws of **${country}**. Any dispute shall be subject to the jurisdiction of the competent courts of **${country}**.

---

## ${form.hasPaidPlans ? '13' : '12'}. Contact

For questions about these Terms: **${email}**

---

*© ${year} ${legal}. All rights reserved.*
`
}

export default function TermsPage() {
  const { t, language } = useI18n()
  const isFr = language === 'fr'
  const [form, setForm] = useState<TermsForm>({
    companyName: '',
    legalName: '',
    country: isFr ? 'France' : 'Canada',
    email: '',
    serviceDescription: isFr ? 'plateforme de gestion de documents juridiques' : 'legal document management platform',
    hasPaidPlans: false,
    minAge: '18',
  })
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = (field: keyof TermsForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const content = showPreview ? generateTerms(form, isFr) : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terms-of-service-${form.companyName || 'document'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('terms.title')}</h1>
        <p className="text-muted-foreground mt-1">{isFr ? 'Générez des conditions d\'utilisation pour votre application' : 'Generate terms of service for your application'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="w-4 h-4 text-primary" />
              {isFr ? 'Informations de l\'entreprise' : 'Company Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isFr ? 'Nom de l\'entreprise' : 'Company Name'}</Label>
                <Input placeholder={isFr ? 'MonApp' : 'MyApp'} value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{isFr ? 'Nom légal enregistré' : 'Registered Legal Name'}</Label>
                <Input placeholder={isFr ? 'MonApp SAS' : 'MyApp Inc.'} value={form.legalName} onChange={e => set('legalName', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isFr ? 'Pays' : 'Country'}</Label>
                <Input value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{isFr ? 'Email de contact légal' : 'Legal Contact Email'}</Label>
                <Input type="email" placeholder="legal@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{isFr ? 'Description du service' : 'Service Description'}</Label>
              <Input value={form.serviceDescription} onChange={e => set('serviceDescription', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isFr ? 'Âge minimum' : 'Minimum Age'}</Label>
                <Input type="number" min="13" max="21" value={form.minAge} onChange={e => set('minAge', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{isFr ? 'Plans payants ?' : 'Has Paid Plans?'}</Label>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant={form.hasPaidPlans ? 'default' : 'outline'} onClick={() => set('hasPaidPlans', true)} className="flex-1">{t('common.yes')}</Button>
                  <Button size="sm" variant={!form.hasPaidPlans ? 'default' : 'outline'} onClick={() => set('hasPaidPlans', false)} className="flex-1">{t('common.no')}</Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={() => setShowPreview(true)} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />{t('terms.preview')}
              </Button>
              {showPreview && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />{isFr ? 'Télécharger' : 'Download'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-4 h-4 text-primary" />
                {isFr ? 'Aperçu' : 'Preview'}
              </CardTitle>
              {showPreview && (
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 mb-4 text-xs text-amber-800 dark:text-amber-300">
              {isFr ? 'Ce document est un modèle informatif et ne constitue pas un avis juridique.' : 'This document is an informational template and does not constitute legal advice.'}
            </div>
            {!showPreview ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <ScrollText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{isFr ? 'Remplissez le formulaire et cliquez sur "Aperçu".' : 'Fill in the form and click "Preview".'}</p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed overflow-auto max-h-[600px] whitespace-pre-wrap font-mono text-xs">
                {content}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
