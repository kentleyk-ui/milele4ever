'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react'
import { LiquidMetalGold, GoldBadge, GoldDivider } from '@/ui-lib'
import { GOLD, MONARK_VERSION } from '@/lib/constants'

const features = [
  { icon: Shield,    title: 'Sécurité totale',   desc: 'Authentification Supabase, logs d\'accès et monitoring des erreurs 401 en temps réel.' },
  { icon: Zap,       title: 'Performance',       desc: 'Dashboard réactif, chargement instantané et export JSONL/CSV des journaux.' },
  { icon: BarChart3, title: 'Analytics avancés', desc: 'Statistiques détaillées sur l\'activité Malaika AI et les requêtes staff.' },
]

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen grid-bg">
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-8 py-20 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${GOLD.primary} 0%, transparent 70%)` }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GoldBadge>v{MONARK_VERSION} — Gold Royal</GoldBadge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-6xl font-black tracking-tight"
          style={{ color: GOLD.light }}
        >
          Monark
          <span className="block text-2xl font-medium mt-2" style={{ color: GOLD.primary + 'cc' }}>
            Console d'administration
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-5 max-w-xl text-base leading-relaxed"
          style={{ color: 'var(--muted)' }}
        >
          Plateforme de monitoring centralisée pour Milele4ever. Consultez les logs,
          analysez les performances et supervisez l'activité de l'IA Malaika en temps réel.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/dashboard">
            <LiquidMetalGold label="Ouvrir le dashboard" size="lg" leftIcon={<ArrowRight className="h-5 w-5" />} />
          </Link>
          <Link href="/logs">
            <LiquidMetalGold label="Voir les logs" size="lg" variant="outline" />
          </Link>
        </motion.div>

        <GoldDivider className="mt-16 w-full max-w-md" />
      </section>

      {/* Features */}
      <section className="px-8 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="rounded-2xl p-6 group"
              style={{ background: 'var(--bg-card)', border: `1px solid ${GOLD.border}` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: GOLD.surface, color: GOLD.light }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold" style={{ color: GOLD.light }}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  )
}
