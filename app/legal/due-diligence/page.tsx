'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ClipboardCheck, Plus, CheckCircle, Circle, AlertCircle, FileUp, ChevronDown, ChevronUp } from 'lucide-react'

interface DDItem {
  id: string
  name: string
  status: 'not_started' | 'uploaded' | 'under_review' | 'approved' | 'flagged'
  files: number
  notes: string
}

interface DDCategory {
  id: string
  name: string
  items: DDItem[]
}

const defaultCategories: DDCategory[] = [
  {
    id: '1',
    name: 'legal.ddCorporate',
    items: [
      { id: '1-1', name: 'Formation documents (articles of incorporation)', status: 'not_started', files: 0, notes: '' },
      { id: '1-2', name: 'Bylaws and operating agreements', status: 'not_started', files: 0, notes: '' },
      { id: '1-3', name: 'Board minutes and resolutions', status: 'not_started', files: 0, notes: '' },
      { id: '1-4', name: 'Capitalization table (cap table)', status: 'not_started', files: 0, notes: '' },
      { id: '1-5', name: 'Good standing certificates', status: 'not_started', files: 0, notes: '' },
      { id: '1-6', name: 'Organizational chart', status: 'not_started', files: 0, notes: '' },
      { id: '1-7', name: 'List of jurisdictions of operation', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '2',
    name: 'legal.ddFinancial',
    items: [
      { id: '2-1', name: 'Audited financial statements (last 3 years)', status: 'not_started', files: 0, notes: '' },
      { id: '2-2', name: 'Interim financial statements (current year)', status: 'not_started', files: 0, notes: '' },
      { id: '2-3', name: 'Tax returns (last 3 years)', status: 'not_started', files: 0, notes: '' },
      { id: '2-4', name: 'Debt schedule and credit agreements', status: 'not_started', files: 0, notes: '' },
      { id: '2-5', name: 'Accounts receivable aging report', status: 'not_started', files: 0, notes: '' },
      { id: '2-6', name: 'Revenue breakdown by product/service', status: 'not_started', files: 0, notes: '' },
      { id: '2-7', name: 'Financial projections and budgets', status: 'not_started', files: 0, notes: '' },
      { id: '2-8', name: 'Bank account statements', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '3',
    name: 'legal.ddContracts',
    items: [
      { id: '3-1', name: 'Major customer contracts', status: 'not_started', files: 0, notes: '' },
      { id: '3-2', name: 'Major vendor/supplier agreements', status: 'not_started', files: 0, notes: '' },
      { id: '3-3', name: 'Partnership and joint venture agreements', status: 'not_started', files: 0, notes: '' },
      { id: '3-4', name: 'Distribution and franchise agreements', status: 'not_started', files: 0, notes: '' },
      { id: '3-5', name: 'Government contracts', status: 'not_started', files: 0, notes: '' },
      { id: '3-6', name: 'Change of control provisions', status: 'not_started', files: 0, notes: '' },
      { id: '3-7', name: 'Non-compete and exclusivity agreements', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '4',
    name: 'legal.ddIP',
    items: [
      { id: '4-1', name: 'Patents and patent applications', status: 'not_started', files: 0, notes: '' },
      { id: '4-2', name: 'Trademarks and trademark registrations', status: 'not_started', files: 0, notes: '' },
      { id: '4-3', name: 'Copyrights and domain registrations', status: 'not_started', files: 0, notes: '' },
      { id: '4-4', name: 'Software licenses and agreements', status: 'not_started', files: 0, notes: '' },
      { id: '4-5', name: 'IP assignments and work-for-hire agreements', status: 'not_started', files: 0, notes: '' },
      { id: '4-6', name: 'Open source software audit', status: 'not_started', files: 0, notes: '' },
      { id: '4-7', name: 'Trade secret documentation', status: 'not_started', files: 0, notes: '' },
      { id: '4-8', name: 'IP infringement claims', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '5',
    name: 'legal.ddEmployees',
    items: [
      { id: '5-1', name: 'Employee census and org chart', status: 'not_started', files: 0, notes: '' },
      { id: '5-2', name: 'Employment agreements and offer letters', status: 'not_started', files: 0, notes: '' },
      { id: '5-3', name: 'Independent contractor agreements', status: 'not_started', files: 0, notes: '' },
      { id: '5-4', name: 'Employee handbook and policies', status: 'not_started', files: 0, notes: '' },
      { id: '5-5', name: 'Non-compete and non-solicitation agreements', status: 'not_started', files: 0, notes: '' },
      { id: '5-6', name: 'Benefits plans and summaries', status: 'not_started', files: 0, notes: '' },
      { id: '5-7', name: 'Stock option and equity plans', status: 'not_started', files: 0, notes: '' },
      { id: '5-8', name: 'Workers compensation and OSHA', status: 'not_started', files: 0, notes: '' },
      { id: '5-9', name: 'Pending labor disputes', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '6',
    name: 'legal.ddLitigation',
    items: [
      { id: '6-1', name: 'Pending litigation and claims', status: 'not_started', files: 0, notes: '' },
      { id: '6-2', name: 'Settled litigation and releases', status: 'not_started', files: 0, notes: '' },
      { id: '6-3', name: 'Consent decrees and injunctions', status: 'not_started', files: 0, notes: '' },
      { id: '6-4', name: 'Regulatory investigations', status: 'not_started', files: 0, notes: '' },
      { id: '6-5', name: 'Insurance claims history', status: 'not_started', files: 0, notes: '' },
      { id: '6-6', name: 'Regulatory correspondence', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '7',
    name: 'legal.ddInsurance',
    items: [
      { id: '7-1', name: 'All insurance policies', status: 'not_started', files: 0, notes: '' },
      { id: '7-2', name: 'Claims history', status: 'not_started', files: 0, notes: '' },
      { id: '7-3', name: 'Insurance broker information', status: 'not_started', files: 0, notes: '' },
      { id: '7-4', name: 'Certificates of insurance', status: 'not_started', files: 0, notes: '' },
    ],
  },
  {
    id: '8',
    name: 'legal.ddTechnology',
    items: [
      { id: '8-1', name: 'System architecture documentation', status: 'not_started', files: 0, notes: '' },
      { id: '8-2', name: 'Data flow and processing diagrams', status: 'not_started', files: 0, notes: '' },
      { id: '8-3', name: 'SOC 2 and security audit reports', status: 'not_started', files: 0, notes: '' },
      { id: '8-4', name: 'Data breach history', status: 'not_started', files: 0, notes: '' },
      { id: '8-5', name: 'Business continuity and disaster recovery plans', status: 'not_started', files: 0, notes: '' },
      { id: '8-6', name: 'SLA and uptime reports', status: 'not_started', files: 0, notes: '' },
      { id: '8-7', name: 'Third-party vendor security assessments', status: 'not_started', files: 0, notes: '' },
      { id: '8-8', name: 'Privacy policy and compliance documentation', status: 'not_started', files: 0, notes: '' },
    ],
  },
]

export default function DueDiligencePage() {
  const { t } = useI18n()
  const [categories, setCategories] = useState<DDCategory[]>(defaultCategories)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['1'])
  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [buyer, setBuyer] = useState('')
  const [seller, setSeller] = useState('')
  const [dealStructure, setDealStructure] = useState('asset')

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const approvedItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'approved').length, 0)
  const uploadedItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'uploaded').length, 0)
  const underReviewItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'under_review').length, 0)
  const flaggedItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'flagged').length, 0)
  const notStartedItems = totalItems - approvedItems - uploadedItems - underReviewItems - flaggedItems

  const progress = Math.round((approvedItems / totalItems) * 100)

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const updateItemStatus = (categoryId: string, itemId: string, status: DDItem['status']) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map(item =>
              item.id === itemId ? { ...item, status } : item
            ),
          }
        : cat
    ))
  }

  const getStatusBadge = (status: DDItem['status']) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline" className="text-xs">{t('legal.ddNotStarted')}</Badge>
      case 'uploaded':
        return <Badge variant="secondary" className="text-xs">{t('legal.ddUploaded')}</Badge>
      case 'under_review':
        return <Badge variant="default" className="bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs">{t('legal.ddUnderReview')}</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">{t('legal.ddApproved')}</Badge>
      case 'flagged':
        return <Badge variant="default" className="bg-red-500/20 text-red-700 dark:text-red-400 text-xs">{t('legal.ddFlagged')}</Badge>
    }
  }

  const getStatusIcon = (status: DDItem['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'flagged': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t('legal.dueDiligence')}</h1>
        <p className="text-muted-foreground">{t('legal.ddRoom')}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        {t('legal.disclaimer')}
      </div>

      {!showCreate ? (
        <>
          {/* Progress Overview */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">{t('legal.ddProgress')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {approvedItems} / {totalItems} {t('legal.ddItems')} {t('legal.ddApproved')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{progress}%</p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-muted-foreground" /> {notStartedItems} {t('legal.ddNotStarted')}</span>
                <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-secondary" /> {uploadedItems} {t('legal.ddUploaded')}</span>
                <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-blue-500" /> {underReviewItems} {t('legal.ddUnderReview')}</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {approvedItems} {t('legal.ddApproved')}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500" /> {flaggedItems} {t('legal.ddFlagged')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <div className="space-y-3">
            {categories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id)
              const catApproved = category.items.filter(i => i.status === 'approved').length
              const catTotal = category.items.length
              const catProgress = Math.round((catApproved / catTotal) * 100)

              return (
                <Card key={category.id}>
                  <CardHeader className="p-4 pb-0">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">{t(category.name as any)}</h3>
                          <p className="text-xs text-muted-foreground">{catApproved} / {catTotal} approved</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 w-32">
                          <Progress value={catProgress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{catProgress}%</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="p-4 pt-2">
                      <div className="space-y-1">
                        {category.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {getStatusIcon(item.status)}
                              <span className="text-sm text-foreground truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item.status)}
                              <Select
                                value={item.status}
                                onValueChange={(v) => updateItemStatus(category.id, item.id, v as DDItem['status'])}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">{t('legal.ddNotStarted')}</SelectItem>
                                  <SelectItem value="uploaded">{t('legal.ddUploaded')}</SelectItem>
                                  <SelectItem value="under_review">{t('legal.ddUnderReview')}</SelectItem>
                                  <SelectItem value="approved">{t('legal.ddApproved')}</SelectItem>
                                  <SelectItem value="flagged">{t('legal.ddFlagged')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      ) : (
        /* Create Room Form */
        <Card>
          <CardHeader>
            <CardTitle>{t('legal.ddCreate')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('legal.ddName')}</Label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Acquisition of TechCorp" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('legal.ddBuyer')}</Label>
                <Input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="Milele Corp" />
              </div>
              <div className="space-y-2">
                <Label>{t('legal.ddSeller')}</Label>
                <Input value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="TechCorp Inc." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('legal.ddDealStructure')}</Label>
              <Select value={dealStructure} onValueChange={setDealStructure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">{t('legal.ddAssetPurchase')}</SelectItem>
                  <SelectItem value="stock">{t('legal.ddStockPurchase')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreate(false)}>{t('common.save')}</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
