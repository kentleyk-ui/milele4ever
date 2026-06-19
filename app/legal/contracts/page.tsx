'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Download, Eye, Copy, Check } from 'lucide-react'

type ContractType = 'mutualNda' | 'oneWayNda' | 'serviceAgreement' | 'freelanceContract' | 'employmentContract' | 'letterOfIntent'

interface ContractForm {
  partyA: string
  partyB: string
  effectiveDate: string
  term: string
  governingLaw: string
  jurisdiction: string
  purpose: string
}

function generateMutualNda(form: ContractForm, t: (k: string, d?: string) => string, isMutual: boolean): string {
  const lang = t('app.name') // used to detect language context
  const title = isMutual ? t('type.mutualNda') : t('type.oneWayNda')
  const partyAName = form.partyA || t('nda.partyA')
  const partyBName = form.partyB || t('nda.partyB')
  const isFr = t('nda.whereas') === 'PRÉAMBULES'

  if (isFr) {
    return `# ${title}

> **⚠️ ${t('contracts.disclaimer')}**

---

**Date d'Effet :** ${form.effectiveDate}
**Durée :** ${form.term} mois
**Droit Applicable :** ${form.governingLaw}
**Juridiction :** ${form.jurisdiction}

---

## ${t('nda.whereas')}

**${partyAName}** (la « ${t('nda.disclosing')} ») et **${partyBName}** (la « ${t('nda.receiving')} ») souhaitent explorer une opportunité commerciale d'intérêt mutuel. Dans le cadre de cette opportunité, chaque partie peut divulguer à l'autre certaines informations confidentielles.

Objet de la divulgation : *${form.purpose || '(à préciser)'}*

---

## 1. ${t('nda.definition')}

« Informations Confidentielles » désigne toutes informations non publiques, exclusives ou confidentielles divulguées par l'une ou l'autre des parties, y compris, sans s'y limiter : les données techniques, le savoir-faire, les recherches, les plans de produits, les codes logiciels, les plans commerciaux, les informations financières, les listes de clients et les stratégies marketing.

---

## 2. ${t('nda.exclusions')}

Les Informations Confidentielles n'incluent pas les informations qui :
- (a) sont ou deviennent du domaine public sans faute de la partie réceptrice ;
- (b) étaient connues de la partie réceptrice avant leur divulgation ;
- (c) sont divulguées légitimement par un tiers sans restriction ;
- (d) ont été développées indépendamment par la partie réceptrice.

---

## 3. ${t('nda.obligations')}

La partie réceptrice s'engage à :
- (a) garder les Informations Confidentielles strictement confidentielles ;
- (b) ne pas divulguer les Informations Confidentielles à des tiers sans consentement écrit préalable ;
- (c) utiliser les Informations Confidentielles uniquement dans le but indiqué ci-dessus ;
- (d) protéger les Informations Confidentielles avec le même degré de soin que ses propres informations confidentielles (au minimum une protection raisonnable) ;
- (e) n'autoriser l'accès aux Informations Confidentielles qu'aux employés ou mandataires ayant besoin d'en connaître et liés par des obligations similaires de confidentialité.

---

## 4. ${t('nda.term')}

Le présent Accord entre en vigueur à la date indiquée ci-dessus et reste en vigueur pendant **${form.term} mois**, sauf résiliation anticipée par consentement mutuel écrit. Les obligations de confidentialité survivent à l'expiration ou à la résiliation de l'Accord.

---

## 5. ${t('nda.return')}

À la demande de la partie divulgatrice, la partie réceptrice restituera ou détruira promptement toutes les Informations Confidentielles et toutes copies de celles-ci.

---

## 6. ${t('nda.remedies')}

Les parties reconnaissent que toute violation du présent Accord causerait un préjudice irréparable. La partie lésée aura droit à des mesures injonctives et à d'autres recours équitables, en plus de tous les autres recours disponibles en droit.

---

## 7. ${t('nda.general')}

**Droit applicable :** Le présent Accord est régi par le droit de **${form.governingLaw}**.
**Juridiction :** Tout litige sera soumis à la compétence exclusive des tribunaux de **${form.jurisdiction}**.
**Intégralité :** Le présent Accord constitue l'intégralité de l'accord entre les parties concernant la confidentialité.
**Modification :** Toute modification doit être faite par écrit et signée par les deux parties.
**Divisibilité :** Si une clause est invalide, les autres clauses restent en vigueur.

---

## 8. ${t('nda.signatures')}

EN FOI DE QUOI, les parties ont signé le présent Accord à compter de la date indiquée ci-dessus.

| **${partyAName}** | **${partyBName}** |
|---|---|
| Signature : _____________________ | Signature : _____________________ |
| Nom : _____________________ | Nom : _____________________ |
| Titre : _____________________ | Titre : _____________________ |
| Date : _____________________ | Date : _____________________ |
`
  }

  return `# ${title}

> **⚠️ ${t('contracts.disclaimer')}**

---

**Effective Date:** ${form.effectiveDate}
**Term:** ${form.term} months
**Governing Law:** ${form.governingLaw}
**Jurisdiction:** ${form.jurisdiction}

---

## ${t('nda.whereas')}

**${partyAName}** (the "Disclosing Party") and **${partyBName}** (the "Receiving Party") wish to explore a business opportunity of mutual interest. In connection with this opportunity, each party may disclose certain confidential information to the other.

Purpose of disclosure: *${form.purpose || '(to be specified)'}*

---

## 1. ${t('nda.definition')}

"Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by either party, including but not limited to: technical data, know-how, research, product plans, software code, business plans, financial information, customer lists, and marketing strategies.

---

## 2. ${t('nda.exclusions')}

Confidential Information does not include information that:
- (a) is or becomes publicly known without fault of the receiving party;
- (b) was known to the receiving party prior to disclosure;
- (c) is lawfully disclosed by a third party without restriction;
- (d) was independently developed by the receiving party.

---

## 3. ${t('nda.obligations')}

The Receiving Party agrees to:
- (a) keep Confidential Information strictly confidential;
- (b) not disclose Confidential Information to third parties without prior written consent;
- (c) use Confidential Information solely for the purpose stated above;
- (d) protect Confidential Information with the same degree of care as its own confidential information (at minimum reasonable care);
- (e) grant access only to employees or agents with a need to know and bound by similar confidentiality obligations.

---

## 4. ${t('nda.term')}

This Agreement is effective as of the date above and shall remain in force for **${form.term} months**, unless terminated earlier by mutual written consent. Confidentiality obligations survive expiration or termination.

---

## 5. ${t('nda.return')}

Upon request from the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information and copies thereof.

---

## 6. ${t('nda.remedies')}

The parties acknowledge that any breach of this Agreement would cause irreparable harm. The non-breaching party shall be entitled to injunctive relief and other equitable remedies in addition to all other remedies available at law.

---

## 7. ${t('nda.general')}

**Governing Law:** This Agreement is governed by the laws of **${form.governingLaw}**.
**Jurisdiction:** Any dispute shall be subject to the exclusive jurisdiction of the courts of **${form.jurisdiction}**.
**Entire Agreement:** This Agreement constitutes the entire agreement between the parties regarding confidentiality.
**Amendments:** Any modifications must be in writing and signed by both parties.
**Severability:** If any provision is invalid, the remaining provisions remain in full force.

---

## 8. ${t('nda.signatures')}

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

| **${partyAName}** | **${partyBName}** |
|---|---|
| Signature: _____________________ | Signature: _____________________ |
| Name: _____________________ | Name: _____________________ |
| Title: _____________________ | Title: _____________________ |
| Date: _____________________ | Date: _____________________ |
`
}

function generateServiceAgreement(form: ContractForm, t: (k: string, d?: string) => string): string {
  const isFr = t('nda.whereas') === 'PRÉAMBULES'
  const partyAName = form.partyA || 'Prestataire'
  const partyBName = form.partyB || 'Client'

  if (isFr) {
    return `# ${t('type.serviceAgreement')}

> **⚠️ ${t('contracts.disclaimer')}**

---

**Date d'Effet :** ${form.effectiveDate}
**Durée :** ${form.term} mois
**Droit Applicable :** ${form.governingLaw}
**Juridiction :** ${form.jurisdiction}

---

## 1. PARTIES

**Prestataire :** ${partyAName}
**Client :** ${partyBName}

---

## 2. SERVICES

Le Prestataire fournira au Client les services suivants : *${form.purpose || '(à préciser)'}*

Le Prestataire exécutera les Services avec compétence professionnelle et conformément aux normes de l'industrie.

---

## 3. RÉMUNÉRATION ET CONDITIONS DE PAIEMENT

Le Client paiera le Prestataire selon les modalités convenues séparément. Les paiements sont exigibles dans un délai de **30 jours** suivant réception de la facture. Tout retard de paiement entraîne des pénalités de retard de 1,5% par mois.

---

## 4. PLAFOND DE RESPONSABILITÉ

La responsabilité totale de chaque partie envers l'autre, quelle qu'en soit la cause, est **plafonnée aux honoraires versés au cours des 12 mois précédant la réclamation**. Aucune des parties ne sera responsable des dommages indirects, consécutifs ou perte de profits.

---

## 5. PROPRIÉTÉ INTELLECTUELLE

Tout livrable créé spécifiquement pour le Client dans le cadre des Services appartiendra au Client à réception du paiement intégral. Le Prestataire **conserve tous les droits sur ses outils, méthodologies et propriété intellectuelle préexistants**.

---

## 6. CONFIDENTIALITÉ

Chaque partie s'engage à maintenir la confidentialité des informations de l'autre partie et à ne pas les divulguer à des tiers sans consentement écrit préalable.

---

## 7. RÉSILIATION

Chaque partie peut résilier le présent Accord avec un préavis écrit de **30 jours**. En cas de résiliation pour manquement matériel, la partie non fautive doit notifier par écrit et laisser **30 jours** pour remédier au manquement.

---

## 8. INDEMNISATION

Chaque partie indemnisera l'autre uniquement pour les réclamations découlant directement de sa propre négligence ou violation du présent Accord. L'indemnisation est soumise au plafond de responsabilité de la Section 4.

---

## 9. DROIT APPLICABLE

Le présent Accord est régi par le droit de **${form.governingLaw}**, juridiction de **${form.jurisdiction}**.

---

## 10. SIGNATURES

| **${partyAName}** (Prestataire) | **${partyBName}** (Client) |
|---|---|
| Signature : _____________________ | Signature : _____________________ |
| Nom : _____________________ | Nom : _____________________ |
| Titre : _____________________ | Titre : _____________________ |
| Date : _____________________ | Date : _____________________ |
`
  }

  return `# ${t('type.serviceAgreement')}

> **⚠️ ${t('contracts.disclaimer')}**

---

**Effective Date:** ${form.effectiveDate}
**Term:** ${form.term} months
**Governing Law:** ${form.governingLaw}
**Jurisdiction:** ${form.jurisdiction}

---

## 1. PARTIES

**Service Provider:** ${partyAName}
**Client:** ${partyBName}

---

## 2. SERVICES

Service Provider will provide Client with the following services: *${form.purpose || '(to be specified)'}*

Service Provider shall perform the Services with professional competence and in accordance with industry standards.

---

## 3. COMPENSATION AND PAYMENT TERMS

Client shall pay Service Provider according to the separately agreed fee schedule. Payment is due within **30 days** of invoice receipt. Late payments accrue interest at 1.5% per month.

---

## 4. LIABILITY CAP

Each party's total liability to the other, regardless of cause, is **capped at fees paid in the 12 months preceding the claim**. Neither party shall be liable for indirect, consequential damages, or lost profits.

---

## 5. INTELLECTUAL PROPERTY

Any deliverables created specifically for Client under the Services shall belong to Client upon full payment. Service Provider **retains all rights to pre-existing tools, methodologies, and intellectual property**.

---

## 6. CONFIDENTIALITY

Each party agrees to maintain the confidentiality of the other party's information and not disclose it to third parties without prior written consent.

---

## 7. TERMINATION

Either party may terminate this Agreement with **30 days** written notice. For material breach, the non-breaching party must provide written notice and allow **30 days** to cure.

---

## 8. INDEMNIFICATION

Each party shall indemnify the other only for claims arising directly from its own negligence or breach of this Agreement. Indemnification is subject to the liability cap in Section 4.

---

## 9. GOVERNING LAW

This Agreement is governed by the laws of **${form.governingLaw}**, jurisdiction of **${form.jurisdiction}**.

---

## 10. SIGNATURES

| **${partyAName}** (Service Provider) | **${partyBName}** (Client) |
|---|---|
| Signature: _____________________ | Signature: _____________________ |
| Name: _____________________ | Name: _____________________ |
| Title: _____________________ | Title: _____________________ |
| Date: _____________________ | Date: _____________________ |
`
}

function generateLOI(form: ContractForm, t: (k: string, d?: string) => string): string {
  const isFr = t('nda.whereas') === 'PRÉAMBULES'
  const buyer = form.partyA || 'Acquéreur'
  const seller = form.partyB || 'Cédant'

  if (isFr) {
    return `# ${t('type.letterOfIntent')}

> **⚠️ ${t('contracts.disclaimer')}**
> **⚠️ Cette lettre est non contraignante, sauf les sections expressément indiquées.**

---

**Date :** ${form.effectiveDate}
**Droit Applicable :** ${form.governingLaw}

---

**De :** ${buyer} (« l'Acquéreur »)
**À :** ${seller} (« le Cédant »)

Objet : *${form.purpose || 'Acquisition de la société cible'}*

---

## 1. STRUCTURE DE LA TRANSACTION *(Non contraignant)*

L'Acquéreur propose d'acquérir [100%] des actions / actifs de la société cible (la « Transaction »). La structure définitive sera précisée dans l'Accord Définitif.

---

## 2. PRIX D'ACQUISITION *(Non contraignant)*

Le prix d'acquisition proposé est de **[À COMPLÉTER]**, sous réserve des ajustements habituels (fonds de roulement, dette, trésorerie). La structure de paiement sera : [comptant à la clôture / earn-out / financement vendeur].

---

## 3. DUE DILIGENCE *(Non contraignant)*

L'Acquéreur disposera d'une période de **45 jours** à compter de la signature pour effectuer une due diligence. Le Cédant s'engage à fournir un accès raisonnable aux documents, systèmes et dirigeants.

---

## 4. EXCLUSIVITÉ *(CONTRAIGNANT)*

Pendant **60 jours** à compter de la signature, le Cédant s'engage à ne pas solliciter, encourager ou négocier avec d'autres acquéreurs potentiels concernant la vente de la société cible.

---

## 5. DÉLAI DE CLÔTURE *(Non contraignant)*

Les parties visent une clôture dans les **90 jours** suivant la signature de la présente lettre, sous réserve de la finalisation de la due diligence et de la négociation de l'Accord Définitif.

---

## 6. CONFIDENTIALITÉ *(CONTRAIGNANT)*

Les parties s'engagent à maintenir la confidentialité de la Transaction et des informations échangées. Un NDA distinct régit les modalités détaillées.

---

## 7. FRAIS *(CONTRAIGNANT)*

Chaque partie supporte ses propres frais et honoraires professionnels liés à la Transaction.

---

## 8. CARACTÈRE NON CONTRAIGNANT *(CONTRAIGNANT)*

La présente lettre est non contraignante, **à l'exception** des sections 4 (Exclusivité), 6 (Confidentialité), 7 (Frais) et 8 (Caractère non contraignant). Elle expire si elle n'est pas signée dans les **15 jours** suivant la date indiquée.

---

## 9. DROIT APPLICABLE *(CONTRAIGNANT)*

Les dispositions contraignantes sont régies par le droit de **${form.governingLaw}**.

---

## ACCEPTATION

| **${buyer}** | **${seller}** |
|---|---|
| Signature : _____________________ | Signature : _____________________ |
| Nom : _____________________ | Nom : _____________________ |
| Date : _____________________ | Date : _____________________ |
`
  }

  return `# ${t('type.letterOfIntent')}

> **⚠️ ${t('contracts.disclaimer')}**
> **⚠️ This letter is non-binding except for sections expressly stated as binding.**

---

**Date:** ${form.effectiveDate}
**Governing Law:** ${form.governingLaw}

---

**From:** ${buyer} ("Buyer")
**To:** ${seller} ("Seller")

Re: *${form.purpose || 'Acquisition of target company'}*

---

## 1. TRANSACTION STRUCTURE *(Non-binding)*

Buyer proposes to acquire [100%] of the shares / assets of the target company (the "Transaction"). The definitive structure will be specified in the Definitive Agreement.

---

## 2. PURCHASE PRICE *(Non-binding)*

The proposed purchase price is **[TO BE COMPLETED]**, subject to customary adjustments (working capital, debt, cash). Payment structure: [cash at closing / earnout / seller financing].

---

## 3. DUE DILIGENCE *(Non-binding)*

Buyer shall have **45 days** from signing to conduct due diligence. Seller agrees to provide reasonable access to documents, systems, and management.

---

## 4. EXCLUSIVITY *(BINDING)*

For **60 days** from signing, Seller agrees not to solicit, encourage, or negotiate with other potential acquirers regarding the sale of the target company.

---

## 5. CLOSING TIMELINE *(Non-binding)*

Parties target closing within **90 days** of signing, subject to completion of due diligence and negotiation of the Definitive Agreement.

---

## 6. CONFIDENTIALITY *(BINDING)*

Parties agree to maintain confidentiality of the Transaction and information exchanged. A separate NDA governs the detailed terms.

---

## 7. EXPENSES *(BINDING)*

Each party bears its own professional fees and expenses related to the Transaction.

---

## 8. NON-BINDING NATURE *(BINDING)*

This letter is non-binding **except** for Sections 4 (Exclusivity), 6 (Confidentiality), 7 (Expenses), and 8 (Non-Binding Nature). It expires if not signed within **15 days** of the date above.

---

## 9. GOVERNING LAW *(BINDING)*

The binding provisions are governed by the laws of **${form.governingLaw}**.

---

## ACCEPTANCE

| **${buyer}** | **${seller}** |
|---|---|
| Signature: _____________________ | Signature: _____________________ |
| Name: _____________________ | Name: _____________________ |
| Date: _____________________ | Date: _____________________ |
`
}

export default function ContractsPage() {
  const { t } = useI18n()
  const [selectedType, setSelectedType] = useState<ContractType>('mutualNda')
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<ContractForm>({
    partyA: '',
    partyB: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    term: '24',
    governingLaw: 'France',
    jurisdiction: 'Paris, France',
    purpose: '',
  })

  const contractTypes: { value: ContractType; label: string }[] = [
    { value: 'mutualNda', label: t('type.mutualNda') },
    { value: 'oneWayNda', label: t('type.oneWayNda') },
    { value: 'serviceAgreement', label: t('type.serviceAgreement') },
    { value: 'freelanceContract', label: t('type.freelanceContract') },
    { value: 'employmentContract', label: t('type.employmentContract') },
    { value: 'letterOfIntent', label: t('type.letterOfIntent') },
  ]

  const handleChange = (field: keyof ContractForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const generateDocument = () => {
    switch (selectedType) {
      case 'mutualNda': return generateMutualNda(form, t, true)
      case 'oneWayNda': return generateMutualNda(form, t, false)
      case 'serviceAgreement':
      case 'freelanceContract':
      case 'employmentContract': return generateServiceAgreement(form, t)
      case 'letterOfIntent': return generateLOI(form, t)
      default: return generateMutualNda(form, t, true)
    }
  }

  const previewContent = showPreview ? generateDocument() : ''

  const handleCopy = () => {
    if (previewContent) {
      navigator.clipboard.writeText(previewContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportPdf = () => {
    if (!previewContent) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${contractTypes.find(c => c.value === selectedType)?.label ?? 'Document'}</title>
          <style>
            body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 0 20px; font-size: 13px; line-height: 1.7; color: #1a1a1a; }
            h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 8px; }
            h2 { font-size: 15px; margin-top: 24px; }
            blockquote { background: #fff8e1; border-left: 4px solid #f59e0b; padding: 10px 14px; margin: 16px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { border: 1px solid #ccc; padding: 10px; vertical-align: top; }
            hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            ul, ol { margin: 8px 0 8px 20px; }
            li { margin: 4px 0; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          ${renderMarkdownToHtml(previewContent)}
          <script>window.print(); window.close();<\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('contracts.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('contracts.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary" />
              {t('contracts.createDocument')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document type */}
            <div className="space-y-1.5">
              <Label>{t('contracts.type')}</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ContractType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('contracts.partyA')}</Label>
                <Input
                  placeholder={t('contracts.partyAPlaceholder')}
                  value={form.partyA}
                  onChange={e => handleChange('partyA', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('contracts.partyB')}</Label>
                <Input
                  placeholder={t('contracts.partyBPlaceholder')}
                  value={form.partyB}
                  onChange={e => handleChange('partyB', e.target.value)}
                />
              </div>
            </div>

            {/* Date + term */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('contracts.effectiveDate')}</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={e => handleChange('effectiveDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('contracts.term')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={form.term}
                  onChange={e => handleChange('term', e.target.value)}
                />
              </div>
            </div>

            {/* Governing law + jurisdiction */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('contracts.governingLaw')}</Label>
                <Input
                  value={form.governingLaw}
                  onChange={e => handleChange('governingLaw', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('contracts.jurisdiction')}</Label>
                <Input
                  value={form.jurisdiction}
                  onChange={e => handleChange('jurisdiction', e.target.value)}
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <Label>{t('contracts.purpose')}</Label>
              <Textarea
                placeholder={t('contracts.purposePlaceholder')}
                value={form.purpose}
                onChange={e => handleChange('purpose', e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => setShowPreview(true)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('contracts.preview')}
              </Button>
              {showPreview && (
                <Button variant="outline" onClick={handleExportPdf}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
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
                {t('contracts.documentPreview')}
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
            {/* Disclaimer banner */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 mb-4 text-xs text-amber-800 dark:text-amber-300">
              {t('contracts.disclaimer')}
            </div>

            {!showPreview ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('contracts.previewEmpty')}</p>
              </div>
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed overflow-auto max-h-[600px]"
                dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(previewContent) }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function renderMarkdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.4em;font-weight:700;border-bottom:2px solid currentColor;padding-bottom:6px;margin:0 0 16px">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.05em;font-weight:600;margin:20px 0 8px">$1</h2>')
    .replace(/^> \*\*(.+)\*\*$/gm, '<div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;padding:8px 12px;margin:8px 0;font-size:0.85em;color:#92400e">$1</div>')
    .replace(/^> (.+)$/gm, '<div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;padding:8px 12px;margin:8px 0;font-size:0.85em">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim()).map(c => `<td style="border:1px solid #e5e7eb;padding:8px 12px">${c.trim()}</td>`)
      return `<tr>${cells.join('')}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (rows) => `<table style="width:100%;border-collapse:collapse;margin:12px 0">${rows}</table>`)
    .replace(/^- \(([a-z])\) (.+)$/gm, '<li style="margin:4px 0"><strong>($1)</strong> $2</li>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/gs, (items) => `<ul style="margin:8px 0 8px 20px;list-style:disc">${items}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br>')
}
