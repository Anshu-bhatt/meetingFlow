import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { BarChart3, CheckSquare, Filter, ListChecks, Plus, Search, Sparkles } from "lucide-react"

const taskStages = [
  { label: "Captured", value: 12, color: "bg-slate-500" },
  { label: "Reviewed", value: 8, color: "bg-primary" },
  { label: "Assigned", value: 6, color: "bg-amber-500" },
  { label: "Completed", value: 5, color: "bg-green-500" },
]

const taskRows = [
  {
    title: "Finalize Q4 budget proposal",
    assignee: "Sarah Smith",
    status: "Reviewed",
    priority: "High",
    deadline: "Fri, Apr 5",
  },
  {
    title: "Share client follow-up summary",
    assignee: "Mike Johnson",
    status: "Assigned",
    priority: "Medium",
    deadline: "Mon, Apr 8",
  },
  {
    title: "Update project timeline",
    assignee: "Alex Chen",
    status: "Captured",
    priority: "Low",
    deadline: "No deadline",
  },
  {
    title: "Send reminder to operations team",
    assignee: "Unassigned",
    status: "Completed",
    priority: "Medium",
    deadline: "Thu, Apr 4",
  },
]

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">Tasks workspace</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Task Pipeline</h1>
            <p className="max-w-2xl text-muted-foreground">
              This screen will become the central place for extracted tasks, review status, assignment, and completion tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New task
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {taskStages.map((stage) => (
            <Card key={stage.label} className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardDescription>{stage.label}</CardDescription>
                <CardTitle className="text-3xl">{stage.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(stage.value / 12) * 100} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Task Review Queue</CardTitle>
                  <CardDescription>Static preview of the review and execution workflow</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI curated
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskRows.map((task, index) => (
                <div key={task.title}>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-secondary/30 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Assignee: {task.assignee}</span>
                        <span>Deadline: {task.deadline}</span>
                        <span>Status: {task.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">Review</Button>
                      <Button variant="outline" size="sm">Assign</Button>
                    </div>
                  </div>
                  {index < taskRows.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Review checklist
                </CardTitle>
                <CardDescription>What this screen should support later</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-green-500" /> Confirm owner</div>
                <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-green-500" /> Confirm deadline</div>
                <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-green-500" /> Flag duplicates</div>
                <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-green-500" /> Send to Slack / Jira</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Future widgets
                </CardTitle>
                <CardDescription>Static placeholders for the next iteration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Confidence score distribution</p>
                <p>• Deadline parsing coverage</p>
                <p>• Duplicate merge alerts</p>
                <p>• Task completion funnel</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
