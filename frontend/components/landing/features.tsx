import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, UserCheck, MessageSquare, LayoutDashboard } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI Task Extraction",
    description: "Advanced AI understands context and extracts actionable tasks from any meeting transcript or notes.",
  },
  {
    icon: UserCheck,
    title: "Smart Assignment",
    description: "Automatically suggests task owners based on context, past assignments, and team expertise.",
  },
  {
    icon: MessageSquare,
    title: "Slack Reminders",
    description: "Sends automated reminders to task owners before deadlines, keeping everyone accountable.",
  },
  {
    icon: LayoutDashboard,
    title: "Task Tracking Dashboard",
    description: "Beautiful dashboard to track all tasks, filter by status, and monitor team progress.",
  },
]

export function Features() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground">
            {"Powerful features to transform your meeting outcomes"}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all group">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
