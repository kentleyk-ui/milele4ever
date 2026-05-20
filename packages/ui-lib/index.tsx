'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

// Color palette
const GOLD_PALETTE = {
  primary: '#d4af37',
  light: '#f0d060',
  dark: '#8b6914',
  glow: 'rgba(212,175,55,0.35)',
  surface: 'rgba(212,175,55,0.08)',
  border: 'rgba(212,175,55,0.2)',
}

// LiquidMetalGold Button
interface LiquidMetalGoldProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  disabled?: boolean
}

export function LiquidMetalGold({
  children,
  onClick,
  variant = 'solid',
  size = 'md',
  className,
  disabled,
}: LiquidMetalGoldProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-5 py-2.5 text-sm font-semibold',
    lg: 'px-8 py-3.5 text-base font-bold',
  }

  const variantClasses = {
    solid: 'text-black',
    outline: 'text-white border-2',
    ghost: 'text-white',
  }

  const baseClasses = clsx(
    'relative rounded-xl transition-all duration-300 overflow-hidden',
    'font-display tracking-wide',
    sizeClasses[size],
    variantClasses[variant],
    className,
    {
      'opacity-50 cursor-not-allowed': disabled,
      'hover:scale-105 active:scale-95 cursor-pointer': !disabled,
    }
  )

  const bgStyle = {
    solid: {
      background: `linear-gradient(135deg, ${GOLD_PALETTE.primary} 0%, ${GOLD_PALETTE.light} 100%)`,
      boxShadow: `0 0 20px ${GOLD_PALETTE.glow}`,
    },
    outline: {
      background: 'transparent',
      border: `2px solid ${GOLD_PALETTE.primary}`,
    },
    ghost: {
      background: 'transparent',
    },
  }

  return (
    <motion.button
      className={baseClasses}
      style={bgStyle[variant]}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
    >
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_PALETTE.light}, transparent)`,
        }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

// GoldBadge
interface GoldBadgeProps {
  children: React.ReactNode
  className?: string
}

export function GoldBadge({ children, className }: GoldBadgeProps) {
  return (
    <span
      className={clsx('inline-block rounded-full px-3 py-1 text-xs font-semibold', className)}
      style={{
        background: GOLD_PALETTE.surface,
        color: GOLD_PALETTE.light,
        border: `1px solid ${GOLD_PALETTE.border}`,
      }}
    >
      {children}
    </span>
  )
}

// GoldDivider
interface GoldDividerProps {
  className?: string
}

export function GoldDivider({ className }: GoldDividerProps) {
  return (
    <div className={clsx('flex items-center gap-3 my-6', className)}>
      <div className="flex-1 h-px" style={{ background: GOLD_PALETTE.border }} />
      <span style={{ color: GOLD_PALETTE.primary }}>◆</span>
      <div className="flex-1 h-px" style={{ background: GOLD_PALETTE.border }} />
    </div>
  )
}
