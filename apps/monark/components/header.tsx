'use client'

import { motion } from 'framer-motion'
import { Bell, Search, LogOut } from 'lucide-react'
import { GOLD } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = 'Console', subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-6"
      style={{ background: 'rgba(12,10,8,0.9)', borderColor: GOLD.border, backdropFilter: 'blur(12px)' }}>
      <div>
        <h1 className="text-base font-bold tracking-wide" style={{ color: GOLD.light }}>{title}</h1>
        {subtitle && <p className="text-xs" style={{ color: GOLD.primary + '80' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition"
          style={{ color: GOLD.primary + 'aa', background: GOLD.surface, border: `1px solid ${GOLD.border}` }}>
          <Search className="h-4 w-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition"
          style={{ color: GOLD.primary + 'aa', background: GOLD.surface, border: `1px solid ${GOLD.border}` }}>
          <Bell className="h-4 w-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => supabase.auth.signOut()}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition"
          style={{ color: '#fb7185', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)' }}>
          <LogOut className="h-4 w-4" />
        </motion.button>
      </div>
    </header>
  )
}
