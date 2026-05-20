'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GOLD } from '@/lib/constants'
import { LiquidMetalGold } from '@/ui-lib'

export { LiquidMetalGold as Button }

interface IconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  title?: string
  variant?: 'gold' | 'danger' | 'neutral'
}

export function IconButton({ icon, onClick, title, variant = 'neutral' }: IconButtonProps) {
  const styles = {
    gold:    { color: GOLD.light,  bg: GOLD.surface, border: GOLD.border },
    danger:  { color: '#fb7185',   bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)' },
    neutral: { color: GOLD.primary + 'aa', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  }
  const s = styles[variant]

  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-xl transition"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {icon}
    </motion.button>
  )
}
