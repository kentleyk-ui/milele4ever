'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Shield, Eye, Copy, Check, Download } from 'lucide-react'

interface PrivacyForm {
  companyName: string
  legalName: string
  country: string
  email: string
  dataCollected: string
  thirdParties: string
  hasPaidPlans: boolean
  minAge: string
}

function generatePrivacyPolicy(form: PrivacyForm, isFr: boolean): string {
  const year = new Date().getFullYear()
  const date = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const company = form.companyName || (isFr ? '[Nom de l\'entreprise]' : '[Company Name]')
  const legal = form.legalName || company
  const country = form.country || (isFr ? '[Pays]' : '[Country]')
  const email = form.email || (isFr ? 'confidentialite@' + company.toLowerCase() + '.com' : 'privacy@' + company.toLowerCase() + '.com')
  const minAge = form.minAge || '18'
  const thirdParties = form.thirdParties || (isFr ? 'Hébergement cloud sécurisé' : 'Secure cloud hosting')
  const dataCollected = form.dataCollected || (isFr ? 'Nom, adresse email, données d\'utilisation' : 'Name, email address, usage data')

  if (isFr) {
    return `# Politique de Confidentialité

**${company}**
*Dernière mise à jour : ${date}*

---

> ⚠️ Ce document est un modèle informatif. Consultez un avocat spécialisé en protection des données pour votre situation spécifique.

---

## 1. Qui Sommes-Nous ?

**Nom légal :** ${legal}
**Pays d'incorporation :** ${country}
**Contact confidentialité :** ${email}

---

## 2. Données Collectées

Nous collectons les données suivantes :

${dataCollected.split('\n').map(d => `- ${d.trim()}`).join('\n')}

---

## 3. Utilisation des Données

Nous utilisons vos données pour :
- Fournir et améliorer nos services
- Vous contacter pour le support et les mises à jour importantes
- Respecter nos obligations légales
- Analyser l'utilisation du service de manière agrégée et anonymisée

---

## 4. Prestataires Tiers

Nous faisons appel aux prestataires suivants qui peuvent traiter vos données :

${thirdParties.split('\n').map(t => `- **${t.trim()}**`).join('\n')}

Chaque prestataire est lié par un accord de traitement de données conforme aux réglementations applicables.

---

## 5. Conservation des Données

Nous conservons vos données aussi longtemps que votre compte est actif ou que nécessaire pour fournir nos services. Vous pouvez demander la suppression de vos données à tout moment.

---

## 6. Vos Droits

Conformément aux lois applicables (RGPD, CCPA, etc.), vous disposez des droits suivants :
- **Accès :** obtenir une copie de vos données personnelles
- **Rectification :** corriger des données inexactes
- **Effacement :** demander la suppression de vos données
- **Portabilité :** recevoir vos données dans un format structuré
- **Opposition :** vous opposer à certains traitements

Pour exercer ces droits, contactez-nous à : **${email}**

---

## 7. Cookies

Nous utilisons uniquement des cookies de session essentiels au fonctionnement du service. Aucun cookie de traçage ou publicitaire n'est utilisé sans votre consentement explicite.

---

## 8. Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS), contrôle d'accès, audits de sécurité réguliers.

---

## 9. Mineurs

Nos services ne sont pas destinés aux personnes de moins de **${minAge} ans**. Si nous découvrons que nous avons collecté des données d'un mineur, nous les supprimerons immédiatement.

${form.hasPaidPlans ? `
## 10. Plans Payants

Si vous souscrivez à un plan payant, vos données de paiement sont traitées par notre prestataire de paiement sécurisé. Nous ne stockons jamais vos données bancaires ou de carte.
` : ''}

## ${form.hasPaidPlans ? '11' : '10'}. Modifications

Nous vous notifierons de toute modification matérielle de cette politique par email avec un préavis de **30 jours** avant l'entrée en vigueur des changements.

---

## ${form.hasPaidPlans ? '12' : '11'}. Droit Applicable

La présente politique est régie par le droit de **${country}**.

---

*© ${year} ${legal}. Tous droits réservés.*
`
  }

  return `# Privacy Policy

**${company}**
*Last updated: ${date}*

---

> ⚠️ This document is an informational template. Consult a data protection attorney for your specific situation.

---

## 1. Who We Are

**Legal name:** ${legal}
**Country of incorporation:** ${country}
**Privacy contact:** ${email}

---

## 2. Data We Collect

We collect the following data:

${dataCollected.split('\n').map(d => `- ${d.trim()}`).join('\n')}

---

## 3. How We Use Your Data

We use your data to:
- Provide and improve our services
- Contact you for support and important updates
- Comply with legal obligations
- Analyze service usage in an aggregated, anonymized manner

---

## 4. Third-Party Service Providers

We use the following providers who may process your data:

${thirdParties.split('\n').map(t => `- **${t.trim()}**`).join('\n')}

Each provider is bound by a Data Processing Agreement compliant with applicable regulations.

---

## 5. Data Retention

We retain your data as long as your account is active or as needed to provide our services. You may request deletion of your data at any time.

---

## 6. Your Rights

Under applicable laws (GDPR, CCPA, etc.), you have the following rights:
- **Access:** obtain a copy of your personal data
- **Rectification:** correct inaccurate data
- **Erasure:** request deletion of your data
- **Portability:** receive your data in a structured format
- **Objection:** object to certain processing activities

To exercise these rights, contact us at: **${email}**

---

## 7. Cookies

We only use session cookies essential to the operation of the service. No tracking or advertising cookies are used without your explicit consent.

---

## 8. Security

We implement technical and organizational measures to protect your data: encryption in transit (TLS), access controls, regular security audits.

---

## 9. Minors

Our services are not intended for persons under **${minAge} years of age**. If we discover we have collected data from a minor, we will delete it immediately.

${form.hasPaidPlans ? `
## 10. Paid Plans

If you subscribe to a paid plan, your payment data is processed by our secure payment provider. We never store your bank or card details.
` : ''}

## ${form.hasPaidPlans ? '11' : '10'}. Changes to This Policy

We will notify you of any material changes by email with **30 days** advance notice before changes take effect.

---

## ${form.hasPaidPlans ? '12' : '11'}. Governing Law

This policy is governed by the laws of **${country}**.

---

*© ${year} ${legal}. All rights reserved.*
`
}

export default function PrivacyPage() {
  const { t, language } = useI18n()
  const isFr = language === 'fr'
  const [form, setForm] = useState<PrivacyForm>({
    companyName: '',
    legalName: '',
    country: isFr ? 'France' : 'Canada',
    email: '',
    dataCollected: isFr ? 'Nom et prénom\nAdresse email\nDonnées d\'utilisation' : 'Full name\nEmail address\nUsage data',
    thirdParties: isFr ? 'Hébergement cloud (ex. AWS, Vercel)\nAnalytics (ex. Vercel Analytics)' : 'Cloud hosting (e.g. AWS, Vercel)\nAnalytics (e.g. Vercel Analytics)',
    hasPaidPlans: false,
    minAge: '18',
  })
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = (field: keyof PrivacyForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const content = showPreview ? generatePrivacyPolicy(form, isFr) : ''

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
    a.download = `privacy-policy-${form.companyName || 'document'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('privacy.title')}</h1>
        <p className="text-muted-foreground mt-1">{isFr ? 'Générez une politique de confidentialité pour votre application' : 'Generate a privacy policy for your application'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              {isFr ? 'Informations de l\'entreprise' : 'Company Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('privacy.companyName')}</Label>
                <Input placeholder={isFr ? 'MonApp' : 'MyApp'} value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('privacy.legalName')}</Label>
                <Input placeholder={isFr ? 'MonApp SAS' : 'MyApp Inc.'} value={form.legalName} onChange={e => set('legalName', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('privacy.country')}</Label>
                <Input value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('privacy.email')}</Label>
                <Input type="email" placeholder="privacy@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('privacy.dataCollected')}</Label>
              <Textarea value={form.dataCollected} onChange={e => set('dataCollected', e.target.value)} rows={3} placeholder={isFr ? 'Une donnée par ligne...' : 'One item per line...'} />
            </div>

            <div className="space-y-1.5">
              <Label>{t('privacy.thirdParties')}</Label>
              <Textarea value={form.thirdParties} onChange={e => set('thirdParties', e.target.value)} rows={3} placeholder={isFr ? 'Un prestataire par ligne...' : 'One provider per line...'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('privacy.minAge')}</Label>
                <Input type="number" min="13" max="21" value={form.minAge} onChange={e => set('minAge', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('privacy.hasPaidPlans')}</Label>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant={form.hasPaidPlans ? 'default' : 'outline'} onClick={() => set('hasPaidPlans', true)} className="flex-1">{t('common.yes')}</Button>
                  <Button size="sm" variant={!form.hasPaidPlans ? 'default' : 'outline'} onClick={() => set('hasPaidPlans', false)} className="flex-1">{t('common.no')}</Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={() => setShowPreview(true)} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />{t('privacy.preview')}
              </Button>
              {showPreview && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />{isFr ? 'Télécharger' : 'Download'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
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
              {isFr ? 'Ce document est un modèle informatif et ne constitue pas un avis juridique. Consultez un avocat spécialisé.' : 'This document is an informational template and does not constitute legal advice. Consult a qualified attorney.'}
            </div>
            {!showPreview ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mb-3 opacity-30" />
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
