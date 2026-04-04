import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Problems } from "@/components/landing/problems"
import { SolutionFlow } from "@/components/landing/solution-flow"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { Docs } from "@/components/landing/docs"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { DottedSurface } from "@/components/ui/dotted-surface"

export default function Home() {
  return (
    <div className="app-shell-wave wm-shell relative min-h-screen bg-background">
      <DottedSurface />
      <Navbar />
      <main className="relative z-[1] pt-16">
        <Hero />
        <Problems />
        <SolutionFlow />
        <Features />
        <Pricing />
        <Docs />
        <CTA />
      </main>
      <Footer className="relative z-[1]" />
    </div>
  )
}
