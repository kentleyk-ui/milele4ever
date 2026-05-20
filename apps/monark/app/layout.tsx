import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

export const metadata: Metadata = {
  title: { default: 'Monark Console', template: '%s — Monark' },
  description: 'Console d\'administration Monark — Milele4ever 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <div className="pl-60 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
