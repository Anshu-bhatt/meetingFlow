"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, CircleDashed, Sparkles } from "lucide-react"

const steps = [
  {
    title: "Upload meeting audio",
    detail: "Add audio/video and let MeetFlow create a transcript.",
    done: true,
  },
  {
    title: "Review extracted tasks",
    detail: "Confirm owner, due date, and priority before saving.",
    done: false,
  },
  {
    title: "Track execution",
    detail: "Move tasks to done and keep teams aligned.",
    done: false,
  },
]

export function DashboardPlan() {
  return (
    <Card className="mb-8 border-border/80 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Task Flow Plan
          </CardTitle>
          <Badge variant="secondary">Local Mode</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div key={step.title} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/40 p-3">
            <div className="mt-0.5 text-muted-foreground">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <CircleDashed className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
