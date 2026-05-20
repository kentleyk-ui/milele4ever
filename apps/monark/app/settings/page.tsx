'use client'

import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { Card } from '@/components/card'
import { LiquidMetalGold, GoldBadge } from 'ui-lib'
import { GOLD, API_BASE, MONARK_VERSION } from '@/lib/constants'

const sections = [
  {
    title: 'API',
    items: [
      { label: 'URL principale', value: API_BASE, type: 'code' },
      { label: 'Version console', value: MONARK_VERSION, type: 'badge' },
    ],
  },
  {
    title: 'Authentification',
    items: [
      { label: 'Provider', value: 'Supabase', type: 'badge' },
      { label: 'Méthode', value: 'Email / Google OAuth', type: 'text' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Paramètres" subtitle="Configuration de la console Monark" />

      <div className="flex-1 p-6 max-w-2xl space-y-5">
        {sections.map((section, si) => (
          <Card key={section.title} delay={si * 0.1}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: GOLD.primary }}>
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: si * 0.1 + i * 0.05 }}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: GOLD.border }}
                >
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{item.label}</span>
                  {item.type === 'code' && (
                    <code className="text-xs rounded-lg px-2.5 py-1 font-mono"
                      style={{ background: GOLD.surface, color: GOLD.light, border: `1px solid ${GOLD.border}` }}>
                      {item.value}
                    </code>
                  )}
                  {item.type === 'badge' && <GoldBadge>{item.value}</GoldBadge>}
                  {item.type === 'text' && (
                    <span className="text-sm" style={{ color: GOLD.light }}>{item.value}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        ))}

        <Card delay={0.3}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD.primary }}>
            Danger
          </h2>
          <p className="mb-4 text-sm" style={{ color: 'var(--muted)' }}>
            Actions irréversibles sur la session et les données de monitoring.
          </p>
          <LiquidMetalGold label="Se déconnecter" size="sm" variant="outline" />
        </Card>
      </div>
    </div>
  )
}
