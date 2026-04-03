"use client"

import { Sparkles, CalendarDays, CheckSquare, Mic2 } from "lucide-react"

const highlights = [
  {
    icon: Mic2,
    title: "Transcribe Meetings",
    description: "Upload recordings and generate transcripts locally with your current setup.",
  },
  {
    icon: CheckSquare,
    title: "Extract Action Items",
    description: "Convert conversations into clear, assignable tasks in seconds.",
  },
  {
    icon: CalendarDays,
    title: "Track Follow-ups",
    description: "Keep deadlines and ownership visible in one dashboard.",
  },
]

export function AuthSplash() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl">
      <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          MeetingFlow Workspace
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Turn meetings into progress</h2>
          <p className="text-sm text-muted-foreground">
            AI-assisted transcription and task extraction designed for fast execution.
          </p>
        </div>

        <div className="space-y-4">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
