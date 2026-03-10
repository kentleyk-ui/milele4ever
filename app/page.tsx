import { LandingHeader } from "@/components/landing/landing-header"
import { Hero } from "@/components/landing/hero"
import { ServicesPreview } from "@/components/landing/services-preview"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <LandingHeader />
      <Hero />
      <ServicesPreview />
      <LandingFooter />
    </main>
  )
}
