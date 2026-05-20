'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GOLD } from '@/lib/constants'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  delay?: number
  onClick?: () => void
}

export function Card({ children, className, glow, delay = 0, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={onClick ? { scale: 1.01, boxShadow: `0 0 32px ${GOLD.glow}` } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-5 transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        background: '#111008',
        border: `1px solid ${GOLD.border}`,
        ...(glow && { boxShadow: `0 0 20px ${GOLD.glow}` }),
      }}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  delta?: string
  icon?: React.ReactNode
  tone?: 'gold' | 'rose' | 'emerald' | 'sky'
  delay?: number
}

export function StatCard({ title, value, delta, icon, tone = 'gold', delay = 0 }: StatCardProps) {
  const colors = {
    gold:    { text: GOLD.light,   glow: GOLD.glow,              bg: GOLD.surface },
    rose:    { text: '#fb7185',    glow: 'rgba(251,113,133,0.3)', bg: 'rgba(251,113,133,0.08)' },
    emerald: { text: '#34d399',    glow: 'rgba(52,211,153,0.3)',  bg: 'rgba(52,211,153,0.08)' },
    sky:     { text: '#38bdf8',    glow: 'rgba(56,189,248,0.3)',  bg: 'rgba(56,189,248,0.08)' },
  }
  const c = colors[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl p-5"
      style={{ background: '#111008', border: `1px solid ${GOLD.border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: GOLD.primary + '80' }}>{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: c.text }}>{value}</p>
          {delta && <p className="mt-1 text-xs" style={{ color: c.text + '90' }}>{delta}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: c.bg, color: c.text }}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
