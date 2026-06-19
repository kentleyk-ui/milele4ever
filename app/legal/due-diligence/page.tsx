'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ClipboardCheck, Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle, FileUp, Clock } from 'lucide-react'

type ItemStatus = 'not_started' | 'uploaded' | 'under_review' | 'approved' | 'flagged'

interface DDItem { id: string; label: string; status: ItemStatus }
interface DDCategory { id: string; name: string; items: DDItem[]; expanded: boolean }
interface DDRoom { id: string; name: string; targetCompany: string; createdAt: string; categories: DDCategory[] }

const DD_FR = [
  { name: 'Documents Corporatifs', items: ['Statuts constitutifs et actes modificatifs', 'Registre des actionnaires', 'Procès-verbaux du conseil', 'Liste des filiales et participations', 'Autorisations réglementaires'] },
  { name: 'Finances', items: ['États financiers 3 derniers exercices (audités)', 'États financiers intermédiaires récents', 'Projections financières', 'Dettes et facilités de crédit', 'Comptes fournisseurs et clients'] },
  { name: 'Propriété Intellectuelle', items: ['Brevets et demandes de brevets', 'Marques déposées', 'Code source et licences logiciels', 'Accords de PI avec employés/prestataires', 'Licences accordées et reçues'] },
  { name: 'Ressources Humaines', items: ['Liste des employés et rémunérations', 'Contrats de travail clés', 'Accords de non-concurrence et confidentialité', 'Plans de stock-options/BSPCE', 'Procédures RH en cours'] },
  { name: 'Contrats Clients & Fournisseurs', items: ['Contrats clients importants (>5% CA)', 'Accords de distribution et partenariat', 'Contrats fournisseurs critiques', 'Accords de sous-traitance', 'Conditions de changement de contrôle'] },
  { name: 'Juridique & Conformité', items: ['Litiges en cours ou potentiels', 'Correspondances avec régulateurs', 'Conformité RGPD/protection des données', 'Licences et permis', 'Politiques anti-corruption'] },
  { name: 'Informatique & Données', items: ['Architecture technique et infrastructure', 'Politique de sécurité informatique', 'Contrats SaaS et cloud', 'Plan de continuité et reprise', 'Incidents de sécurité passés'] },
  { name: 'Immobilier', items: ['Baux immobiliers', 'Actifs immobiliers détenus', 'Suretés et hypothèques', 'Baux d\'équipements et leasing'] },
]

const DD_EN = [
  { name: 'Corporate Documents', items: ['Articles of incorporation and amendments', 'Shareholder register', 'Board meeting minutes', 'Subsidiaries and affiliates list', 'Regulatory approvals'] },
  { name: 'Financials', items: ['3-year audited financial statements', 'Recent interim financial statements', 'Financial projections', 'Debt and credit facilities', 'Accounts payable and receivable'] },
  { name: 'Intellectual Property', items: ['Patents and patent applications', 'Trademarks', 'Source code and software licenses', 'Employee/contractor IP agreements', 'Inbound and outbound licenses'] },
  { name: 'Human Resources', items: ['Employee list and compensation', 'Key employment contracts', 'Non-compete and confidentiality agreements', 'Equity/option plans', 'Pending HR proceedings'] },
  { name: 'Customer & Supplier Contracts', items: ['Key customer contracts (>5% revenue)', 'Distribution and partnership agreements', 'Critical supplier contracts', 'Subcontracting agreements', 'Change-of-control provisions'] },
  { name: 'Legal & Compliance', items: ['Pending or threatened litigation', 'Regulatory correspondence', 'GDPR/data protection compliance', 'Licenses and permits', 'Anti-corruption policies'] },
  { name: 'IT & Data', items: ['Technical architecture and infrastructure', 'IT security policy', 'SaaS and cloud contracts', 'Business continuity plan', 'Past security incidents'] },
  { name: 'Real Estate', items: ['Leases', 'Owned real estate', 'Mortgages and liens', 'Equipment leases'] },
]

function buildCategories(tpl: { name: string; items: string[] }[]): DDCategory[] {
  return tpl.map((cat, ci) => ({
    id: `cat-${ci}`,
    name: cat.name,
    expanded: ci === 0,
    items: cat.items.map((item, ii) => ({ id: `item-${ci}-${ii}`, label: item, status: 'not_started' as ItemStatus })),
  }))
}

const STATUS_CYCLE: ItemStatus[] = ['not_started', 'uploaded', 'under_review', 'approved', 'flagged', 'not_started']

export default function DueDiligencePage() {
  const { t, language } = useI18n()
  const isFr = language === 'fr'
  const [rooms, setRooms] = useState<DDRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<DDRoom | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [targetCompany, setTargetCompany] = useState('')

  const createRoom = () => {
    if (!roomName.trim()) return
    const room: DDRoom = {
      id: Date.now().toString(),
      name: roomName,
      targetCompany,
      createdAt: new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US'),
      categories: buildCategories(isFr ? DD_FR : DD_EN),
    }
    setRooms(prev => [...prev, room])
    setActiveRoom(room)
    setRoomName(''); setTargetCompany(''); setShowForm(false)
  }

  const mutateRoom = (fn: (r: DDRoom) => DDRoom) => {
    setRooms(prev => prev.map(r => r.id === activeRoom?.id ? fn(r) : r))
    setActiveRoom(prev => prev ? fn(prev) : prev)
  }

  const cycleStatus = (catId: string, itemId: string) => {
    mutateRoom(room => ({
      ...room,
      categories: room.categories.map(cat => cat.id !== catId ? cat : {
        ...cat,
        items: cat.items.map(item => item.id !== itemId ? item : {
          ...item,
          status: STATUS_CYCLE[STATUS_CYCLE.indexOf(item.status) + 1],
        }),
      }),
    }))
  }

  const toggleCat = (catId: string) => {
    mutateRoom(room => ({
      ...room,
      categories: room.categories.map(cat => cat.id === catId ? { ...cat, expanded: !cat.expanded } : cat),
    }))
  }

  const getRoomProg = (room: DDRoom) => {
    const all = room.categories.flatMap(c => c.items)
    const done = all.filter(i => i.status !== 'not_started').length
    return { done, total: all.length, pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0 }
  }

  const statusCfg = (s: ItemStatus) => ({
    not_started: { icon: Circle, color: 'text-muted-foreground', label: t('dd.status.notStarted') },
    uploaded: { icon: FileUp, color: 'text-blue-500', label: t('dd.status.uploaded') },
    under_review: { icon: Clock, color: 'text-amber-500', label: t('dd.status.underReview') },
    approved: { icon: CheckCircle2, color: 'text-green-500', label: t('dd.status.approved') },
    flagged: { icon: AlertCircle, color: 'text-red-500', label: t('dd.status.flagged') },
  }[s])

  if (activeRoom) {
    const prog = getRoomProg(activeRoom)
    return (
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveRoom(null)}>← {t('dd.back')}</Button>
          <div>
            <h1 className="text-xl font-bold">{activeRoom.name}</h1>
            {activeRoom.targetCompany && <p className="text-sm text-muted-foreground">{activeRoom.targetCompany}</p>}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t('dd.progress')}</span>
              <span className="text-muted-foreground">{prog.done}/{prog.total} {t('dd.items')} · {prog.pct}%</span>
            </div>
            <Progress value={prog.pct} className="h-2" />
          </CardContent>
        </Card>

        <div className="space-y-2">
          {activeRoom.categories.map(cat => {
            const catDone = cat.items.filter(i => i.status !== 'not_started').length
            return (
              <Card key={cat.id}>
                <button onClick={() => toggleCat(cat.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
                  {cat.expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className="font-medium text-sm flex-1">{cat.name}</span>
                  <Badge variant="outline" className="text-xs">{catDone}/{cat.items.length}</Badge>
                </button>
                {cat.expanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {cat.items.map(item => {
                      const cfg = statusCfg(item.status)
                      const Icon = cfg.icon
                      return (
                        <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                            <span className="text-sm truncate">{item.label}</span>
                          </div>
                          <button onClick={() => cycleStatus(cat.id, item.id)} className="shrink-0">
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted transition-colors whitespace-nowrap">
                              {cfg.label}
                            </Badge>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dd.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dd.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('dd.newRoom')}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('dd.createRoom')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('dd.roomName')}</Label>
                <Input placeholder={t('dd.roomNamePlaceholder')} value={roomName} onChange={e => setRoomName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('dd.targetCompany')}</Label>
                <Input placeholder="TechCorp Inc." value={targetCompany} onChange={e => setTargetCompany(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createRoom} disabled={!roomName.trim()}>{t('dd.create')}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('dd.cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <ClipboardCheck className="w-14 h-14 mb-4 opacity-30" />
          <p className="text-sm">{t('dd.noRooms')}</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />{t('dd.newRoom')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map(room => {
            const prog = getRoomProg(room)
            return (
              <Card key={room.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveRoom(room)}>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    {room.targetCompany && <p className="text-sm text-muted-foreground">{room.targetCompany}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{room.createdAt}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{prog.done}/{prog.total} {t('dd.items')}</span>
                      <span>{prog.pct}%</span>
                    </div>
                    <Progress value={prog.pct} className="h-1.5" />
                  </div>
                  <p className="text-xs text-muted-foreground">{room.categories.length} {t('dd.categories')}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
