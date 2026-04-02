import { FileText, Sparkles, CheckSquare, Bell, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Transcript",
    description: "Paste your meeting notes or transcript",
  },
  {
    icon: Sparkles,
    title: "AI Processing",
    description: "Our AI extracts actionable tasks",
  },
  {
    icon: CheckSquare,
    title: "Tasks Created",
    description: "Tasks with owners and deadlines",
  },
  {
    icon: Bell,
    title: "Reminders",
    description: "Automated follow-ups via Slack",
  },
]

export function SolutionFlow() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            From Meeting to Action in Seconds
          </h2>
          <p className="text-lg text-muted-foreground">
            {"A simple workflow that actually works"}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center text-center w-40 md:w-48">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 hover:bg-primary/20 transition-colors">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
