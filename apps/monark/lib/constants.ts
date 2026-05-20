export const MONARK_VERSION = '2026.1.0'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://www.milele4ever.com'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const NAV_ITEMS = [
  { label: 'Accueil',    href: '/',          icon: 'Home' },
  { label: 'Dashboard',  href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Logs',       href: '/logs',      icon: 'ScrollText' },
  { label: 'Paramètres', href: '/settings',  icon: 'Settings' },
] as const

export const GOLD = {
  primary:  '#d4af37',
  light:    '#f0d060',
  dark:     '#8b6914',
  glow:     'rgba(212,175,55,0.35)',
  surface:  'rgba(212,175,55,0.08)',
  border:   'rgba(212,175,55,0.2)',
} as const

export const LOG_TYPES = ['error', 'info', 'debug', 'request', 'response', 'auth'] as const
