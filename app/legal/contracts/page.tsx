'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, Eye, Shield, ArrowRight, ScrollText } from 'lucide-react'

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

export default function ContractsPage() {
  const { t } = useI18n()
  const [selectedType, setSelectedType] = useState<ContractType>('mutualNda')
  const [showPreview, setShowPreview] = useState(false)
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
    { value: 'mutualNda', label: t('legal.mutualNda') },
    { value: 'oneWayNda', label: t('legal.oneWayNda') },
    { value: 'serviceAgreement', label: t('legal.serviceAgreement') },
    { value: 'freelanceContract', label: t('legal.freelanceContract') },
    { value: 'employmentContract', label: t('legal.employmentContract') },
    { value: 'letterOfIntent', label: t('legal.letterOfIntent') },
  ]

  const handleChange = (field: keyof ContractForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const generateNda = () => {
    const isMutual = selectedType === 'mutualNda'
    const title = isMutual ? t('legal.mutualNda') : t('legal.oneWayNda')
    return `# ${title}

**${t('legal.disclaimer')}**

---

**${t('legal.effectiveDate')}:** ${form.effectiveDate}

**${t('legal.term')}:** ${form.term} ${t('legal.term').includes('months') ? '' : 'months'}

**${t('legal.governingLaw')}:** ${form.governingLaw}
**${t('legal.jurisdiction')}:** ${form.jurisdiction}

---

## ${t('legal.ndaWhereas')}

${form.partyA} ("${t('legal.partyA')}") and ${form.partyB} ("${t('legal.partyB')}") wish to explore a business opportunity of mutual interest. In connection with this opportunity, each party may disclose certain confidential information to the other.

## 1. ${t('legal.ndaDefinition')}

"Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by either party, including but not limited to: technical data, know-how, research, product plans, software code, business plans, financial information, customer lists, and marketing strategies.

## 2. ${t('legal.ndaExclusions')}

Confidential Information does not include information that: (a) is publicly available; (b) was rightfully known by the receiving party prior to disclosure; (c) was independently developed without use of the disclosing party's information.

## 3. ${t('legal.ndaObligations')}

The receiving party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose to any third parties; (c) use solely for the ${t('legal.ndaPermittedPurpose')}: ${form.purpose || 'evaluation of the business opportunity'}.

## 4. ${t('legal.ndaNoLicense')}

No license, express or implied, is granted under any patent, copyright, trademark, or trade secret by the disclosure of Confidential Information.

## 5. ${t('legal.ndaReturn')}

Upon request, the receiving party shall promptly return or destroy all Confidential Information and certify such destruction in writing.

## 6. ${t('legal.ndaTerm')}

This Agreement shall remain in effect for ${form.term} months from the Effective Date. The obligations of confidentiality shall survive termination for a period of 3 years.

## 7. ${t('legal.ndaRemedies')}

The parties acknowledge that breach of this Agreement may cause irreparable harm for which monetary damages would be inadequate. The disclosing party shall be entitled to seek injunctive relief.

## 8. ${t('legal.ndaMisc')}

This Agreement constitutes the entire agreement between the parties. It may not be amended except in writing signed by both parties. It is binding upon and inures to the benefit of the parties and their successors.

---

**${form.partyA}**

Signature: _________________________
Name: _________________________
Title: _________________________
Date: _________________________

**${form.partyB}**

Signature: _________________________
Name: _________________________
Title: _________________________
Date: _________________________
`
  }

  const generateLoi = () => {
    return `# ${t('legal.letterOfIntent')}

**${t('legal.disclaimer')}**

---

Date: ${form.effectiveDate}

**${form.partyA}** ("Buyer")
**${form.partyB}** ("Seller")

---

## 1. ${t('legal.loiTransaction')}

Buyer proposes to acquire [business/assets] from Seller.

## 2. ${t('legal.loiPrice')}

The proposed purchase price is [amount], subject to due diligence and final negotiation.

## 3. ${t('legal.loiDueDiligence')}

Buyer shall have ${form.term} days to conduct due diligence.

## 4. ${t('legal.loiExclusivity')}

Seller agrees not to solicit or negotiate with other potential buyers for a period of ${form.term} days.

## 5. ${t('legal.loiConfidentiality')}

All information exchanged shall be kept confidential.

## 6. ${t('legal.loiBinding')}

Sections on confidentiality, exclusivity, and expenses are binding. All other provisions are non-binding.

## 7. ${t('legal.loiExpiration')}

This Letter of Intent expires if not signed within 15 days.

---

**${form.partyA}**

Signature: _________________________
Date: _________________________

**${form.partyB}**

Signature: _________________________
Date: _________________________
`
  }

  const generateDocument = () => {
    if (selectedType.includes('Nda')) return generateNda()
    if (selectedType === 'letterOfIntent') return generateLoi()
    return generateNda()
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t('legal.contracts')}</h1>
        <p className="text-muted-foreground">{t('legal.draftContract')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('legal.createDocument')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type */}
            <div className="space-y-2">
              <Label>{t('legal.documentType')}</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ContractType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('legal.partyA')}</Label>
                <Input
                  value={form.partyA}
                  onChange={(e) => handleChange('partyA', e.target.value)}
                  placeholder="Company A"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('legal.partyB')}</Label>
                <Input
                  value={form.partyB}
                  onChange={(e) => handleChange('partyB', e.target.value)}
                  placeholder="Company B"
                />
              </div>
            </div>

            {/* Dates & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('legal.effectiveDate')}</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('legal.term')}</Label>
                <Input
                  value={form.term}
                  onChange={(e) => handleChange('term', e.target.value)}
                  placeholder="24"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('legal.governingLaw')}</Label>
                <Input
                  value={form.governingLaw}
                  onChange={(e) => handleChange('governingLaw', e.target.value)}
                  placeholder="France"
                />
              </div>
            </div>

            {/* Jurisdiction & Purpose */}
            <div className="space-y-2">
              <Label>{t('legal.jurisdiction')}</Label>
              <Input
                value={form.jurisdiction}
                onChange={(e) => handleChange('jurisdiction', e.target.value)}
                placeholder="Paris, France"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('legal.purpose')}</Label>
              <Textarea
                value={form.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="Evaluation of potential partnership..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setShowPreview(true)} className="gap-2">
                <Eye className="w-4 h-4" />
                {t('legal.preview')}
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                {t('legal.exportPdf')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className={showPreview ? '' : 'hidden lg:flex'}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              {t('legal.preview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4 text-xs text-amber-800 dark:text-amber-300">
              {t('legal.disclaimer')}
            </div>
            <div className="bg-muted/50 rounded-md p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                {generateDocument()}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
