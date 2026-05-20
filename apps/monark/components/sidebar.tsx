'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, LayoutDashboard, ScrollText, Settings, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GOLD } from '@/lib/constants'

const icons = { Home, LayoutDashboard, ScrollText, Settings }

const items = [
  { label: 'Accueil',    href: '/',          icon: 'Home' },
  { label: 'Dashboard',  href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Logs',       href: '/logs',      icon: 'ScrollText' },
  { label: 'Paramètres', href: '/settings',  icon: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-60 flex-col border-r"
      style={{ background: '#0c0a08', borderColor: GOLD.border }}>
      <div className="flex h-16 items-center gap-3 px-5 border-b" style={{ borderColor: GOLD.border }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `linear-gradient(135deg, ${GOLD.dark}, ${GOLD.primary})` }}>
          <span className="text-sm font-black text-black">M</span>
        </div>
        <div>
          <p className="text-sm font-bold tracking-widest" style={{ color: GOLD.light }}>MONARK</p>
          <p className="text-[10px]" style={{ color: GOLD.primary + '80' }}>Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons]
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'text-black' : 'hover:bg-white/5'
                )}
                style={active ? { background: `linear-gradient(135deg, ${GOLD.dark}, ${GOLD.primary})`, color: '#000' } : { color: GOLD.primary + 'cc' }}
              >
                {active && (
                  <motion.span layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${GOLD.dark}, ${GOLD.primary})` }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                <span className="relative z-10">{item.label}</span>
                {active && <ChevronRight className="relative z-10 ml-auto h-3 w-3" />}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t text-[10px]" style={{ borderColor: GOLD.border, color: GOLD.primary + '50' }}>
        Monark Console v2026
      </div>
    </aside>
  )
}
