import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for individuals trying out MeetingFlow.",
    features: ["5 AI Extracted Tasks/mo", "Basic Smart Assignment", "Community Support", "1 Workspace"],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    description: "Ideal for growing teams needing more power.",
    features: ["Unlimited Tasks", "Advanced Smart Assignment", "Slack Reminders", "Task Tracking Dashboard", "Priority Support"],
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with complex needs.",
    features: ["Everything in Pro", "Custom Workflows", "Dedicated Success Manager", "SSO Authentication", "SLA Guarantee"],
    buttonText: "Contact Sales",
    popular: false,
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Invest in better meetings and effortless task management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {tiers.map((tier, i) => (
            <Card key={i} className={`wm-card relative flex flex-col hover:border-primary/60 transition-all ${tier.popular ? 'border-primary/50 shadow-lg shadow-primary/10 md:scale-105 z-10' : ''}`}>
              {tier.popular && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  {tier.price}
                  {tier.price !== "Custom" && <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>}
                </div>
                <CardDescription className="pt-4 text-sm leading-relaxed">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-8">
                <Button className="w-full" variant={tier.popular ? "default" : "outline"}>
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
