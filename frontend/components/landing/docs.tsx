import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Code, Terminal, Zap } from "lucide-react"

export function Docs() {
  return (
    <section id="docs" className="py-24 bg-secondary/10">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Developer Documentation
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore our guides, API references, and tutorials to get the most out of MeetingFlow.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="wm-card hover:border-primary/60 hover:-translate-y-1 transition-all cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                A quick-start guide to integrating MeetingFlow into your daily workflow.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="wm-card hover:border-primary/60 hover:-translate-y-1 transition-all cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-2">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Detailed endpoints for querying extracted tasks and workspace users.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="wm-card hover:border-primary/60 hover:-translate-y-1 transition-all cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Listen to real-time events when new tasks are assigned or completed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="wm-card hover:border-primary/60 hover:-translate-y-1 transition-all cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-2">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">SDKs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Client libraries for JavaScript, Python, and more languages.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
