'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LiquidMetalGoldProps {
  label: string
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'ghost'
  className?: string
  type?: 'button' | 'submit'
  leftIcon?: React.ReactNode
}

export function LiquidMetalGold({
  label,
  onClick,
  disabled,
  size = 'md',
  variant = 'solid',
  className,
  type = 'button',
  leftIcon,
}: LiquidMetalGoldProps) {
  const sizes = {
    sm: 'px-4 py-2 text-xs h-8',
    md: 'px-5 py-2.5 text-sm h-10',
    lg: 'px-7 py-3 text-base h-12',
  }

  const variants = {
    solid: 'bg-gradient-to-r from-[#b8960c] via-[#f0d060] to-[#b8960c] text-black shadow-[0_0_24px_rgba(212,175,55,0.4)]',
    outline: 'border border-[#d4af37] text-[#f0d060] bg-transparent hover:bg-[#d4af37]/10',
    ghost: 'text-[#f0d060] bg-transparent hover:bg-[#d4af37]/10',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03, backgroundPosition: '100% center' }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden',
        sizes[size],
        variants[variant],
        variant === 'solid' && 'bg-[length:200%_auto] hover:brightness-110',
        className,
      )}
    >
      {variant === 'solid' && (
        <motion.span
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% center', '-200% center'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        />
      )}
      {leftIcon && <span className="relative z-10">{leftIcon}</span>}
      <span className="relative z-10">{label}</span>
    </motion.button>
  )
}

export function GoldBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-0.5 text-xs font-medium text-[#f0d060]',
      className
    )}>
      {children}
    </span>
  )
}

export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="flex-1 border-t border-[#d4af37]/20" />
      <span className="mx-3 text-[#d4af37]/40 text-xs">◆</span>
      <div className="flex-1 border-t border-[#d4af37]/20" />
    </div>
  )
}
