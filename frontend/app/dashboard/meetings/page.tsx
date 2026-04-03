import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AudioLines, CalendarDays, Mic, PlayCircle, Sparkles, Upload } from "lucide-react"

const meetings = [
  {
    title: "Weekly Product Sync",
    type: "Recorded",
    duration: "42 min",
    result: "12 tasks extracted",
  },
  {
    title: "Client Demo Follow-up",
    type: "Live",
    duration: "28 min",
    result: "5 commitments detected",
  },
  {
    title: "Ops Review",
    type: "Transcript",
    duration: "55 min",
    result: "3 deadlines flagged",
  },
]

const meetingFlow = [
  "Upload audio or video recording",
  "Whisper transcription creates clean text",
  "AI extracts owners, deadlines, and priorities",
  "Review transcript before saving",
  "Push tasks to Slack / Jira",
]

export default function MeetingsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">Meeting intake</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Meetings Workspace</h1>
            <p className="max-w-2xl text-muted-foreground">
              This screen will host transcript upload, recording review, live meeting capture, and transcript-to-task handoff.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload recording
            </Button>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Start extraction
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AudioLines className="h-5 w-5 text-primary" />
                Meeting Intake Flow
              </CardTitle>
              <CardDescription>Static preview of the upload-first experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    <Mic className="h-4 w-4 text-primary" />
                    Audio / video upload
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Drop meeting recordings here before transcription. This is where we’ll connect Whisper or a local transcription engine.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/20 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    Live meeting mode
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A future real-time mode will capture spoken action items as they happen during the meeting.
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h3 className="font-semibold">Planned meeting pipeline</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {meetingFlow.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Recent meetings
              </CardTitle>
              <CardDescription>Static examples of the meeting history list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.title} className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{meeting.title}</div>
                      <div className="text-sm text-muted-foreground">{meeting.type} • {meeting.duration}</div>
                    </div>
                    <Badge variant={meeting.type === "Live" ? "default" : "secondary"}>{meeting.type}</Badge>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">{meeting.result}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
