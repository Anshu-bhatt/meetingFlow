import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, UserX, MessagesSquare } from "lucide-react"

const problems = [
  {
    icon: AlertCircle,
    title: "Tasks Get Forgotten",
    description: "Important action items slip through the cracks when buried in meeting notes nobody reads.",
  },
  {
    icon: UserX,
    title: "No Clear Ownership",
    description: "Without explicit assignment, tasks become everyone&apos;s responsibility — which means no one&apos;s.",
  },
  {
    icon: MessagesSquare,
    title: "Follow-ups Are Messy",
    description: "Chasing people for updates across Slack, email, and meetings wastes hours every week.",
  },
]

export function Problems() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Meetings Are Broken
          </h2>
          <p className="text-lg text-muted-foreground">
            {"Teams lose hours every week to these common problems"}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, i) => (
            <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {problem.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
