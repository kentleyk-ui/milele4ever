import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Monark — Console',
  description: 'Monitoring et logs Monark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        {children}
      </body>
    </html>
  )
}
