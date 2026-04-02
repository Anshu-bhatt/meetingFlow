import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative max-w-4xl mx-auto">
          {/* Background glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
          
          <div className="relative bg-card border border-border rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Stop Losing Tasks After Meetings
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              {"Join teams who've transformed their meeting productivity with AI-powered task extraction."}
            </p>
            <Button size="lg" asChild className="text-base px-10">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
