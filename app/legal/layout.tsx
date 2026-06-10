import { LegalNav } from '@/components/legal/legal-nav'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LegalNav />
      <main className="flex-1 pb-8">
        {children}
      </main>
    </div>
  )
}
