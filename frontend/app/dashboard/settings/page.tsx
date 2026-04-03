import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { BellRing, Bot, Link2, ShieldCheck, Slack, Settings2, Smartphone, Zap } from "lucide-react"

const integrations = [
  {
    icon: Slack,
    title: "Slack",
    description: "Send task reminders and assignee notifications.",
    status: "Planned",
  },
  {
    icon: Link2,
    title: "Jira",
    description: "Create issues from extracted tasks.",
    status: "Planned",
  },
  {
    icon: Bot,
    title: "LLM Provider",
    description: "Choose Groq, Ollama, or another model provider.",
    status: "Configurable",
  },
]

const toggles = [
  "Auto-merge duplicate tasks",
  "Flag low-confidence extraction",
  "Send overdue reminders",
  "Create meeting summary after upload",
]

export default function SettingsPage() {
  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardPageHeader
          backHref="/dashboard"
          backLabel="Back"
          title="Settings"
          description="Integrations, automation rules, account preferences, and security controls."
          badge={<Badge variant="secondary" className="w-fit">Workspace settings</Badge>}
          end={
            <Button className="gap-2">
              <Settings2 className="h-4 w-4" />
              Save changes
            </Button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="wm-card border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Integration center
              </CardTitle>
              <CardDescription>Static options for the systems we will connect next</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.title}
                  className="interactive-surface flex flex-col gap-4 rounded-2xl border-2 border-border/80 bg-secondary/30 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <integration.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{integration.title}</div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{integration.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="wm-card border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BellRing className="h-5 w-5 text-primary" />
                  Automation rules
                </CardTitle>
                <CardDescription>Planned switches for the reminder and review workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {toggles.map((toggle) => (
                  <div
                    key={toggle}
                    className="interactive-surface flex items-center justify-between rounded-xl border-2 border-border/80 bg-secondary/20 px-4 py-3"
                  >
                    <span>{toggle}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Preview</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="wm-card border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Security and access
                </CardTitle>
                <CardDescription>Static placeholders for auth and team management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>• Local workspace identity (no external auth provider)</p>
                <p>• Team membership and workspace roles</p>
                <p>• Audit trail for task changes</p>
                <Separator />
                <p className="flex items-center gap-2 text-foreground">
                  <Smartphone className="h-4 w-4 text-primary" /> Mobile-ready reminders and notifications
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
