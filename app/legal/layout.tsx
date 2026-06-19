import { LegalNav } from '@/components/legal/legal-nav'
import { LegalFooter } from '@/components/legal/legal-footer'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LegalNav />
      <main className="flex-1 pb-12">
        {children}
      </main>
      <LegalFooter />
    </div>
  )
}
