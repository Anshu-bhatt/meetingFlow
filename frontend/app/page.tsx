import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Problems } from "@/components/landing/problems"
import { SolutionFlow } from "@/components/landing/solution-flow"
import { Features } from "@/components/landing/features"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="wm-shell min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Problems />
        <SolutionFlow />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
