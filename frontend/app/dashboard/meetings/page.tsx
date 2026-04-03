"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Show, useAuth } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import AudioUpload from "@/components/dashboard/audio-upload"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AudioLines, ArrowLeft, CalendarDays, Mic, PlayCircle, Sparkles, Upload } from "lucide-react"
import { fetchMeetings, fetchTasksForMeeting, type BackendMeeting } from "@/lib/meetings-api"
import { toast } from "sonner"

type MeetingSummary = {
  id: string
  title: string
  createdAt: string
  taskCount: number
}

const meetingFlow = [
  "Upload audio or video recording",
  "Whisper transcription creates clean text",
  "AI extracts owners, deadlines, and priorities",
  "Review transcript before saving",
  "Published tasks appear in Dashboard and Tasks pages",
]

export default function MeetingsPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [transcript, setTranscript] = useState("")
  const [meetings, setMeetings] = useState<MeetingSummary[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const loadMeetingHistory = useCallback(async () => {
    setIsLoadingHistory(true)

    try {
      const token = await getToken().catch(() => null)
      const rows = await fetchMeetings(token)

      const withTaskCounts = await Promise.all(
        rows.map(async (meeting: BackendMeeting) => {
          try {
            const tasks = await fetchTasksForMeeting(meeting.id, token)
            return {
              id: meeting.id,
              title: meeting.title || "Untitled meeting",
              createdAt: meeting.created_at || "",
              taskCount: tasks.length,
            }
          } catch (error) {
            console.error(`Failed loading tasks for meeting ${meeting.id}:`, error)
            return {
              id: meeting.id,
              title: meeting.title || "Untitled meeting",
              createdAt: meeting.created_at || "",
              taskCount: 0,
            }
          }
        }),
      )

      setMeetings(withTaskCounts)
    } catch (error) {
      console.error("Failed loading meetings", error)
      toast.error("Could not load meeting history")
    } finally {
      setIsLoadingHistory(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadMeetingHistory()
  }, [loadMeetingHistory])

  const handleUploadedTranscript = (text: string) => {
    setTranscript(text)
  }

  const sendToDashboard = () => {
    if (!transcript.trim()) {
      return
    }

    window.localStorage.setItem("meetingflow.latestTranscript", transcript)
    router.push("/dashboard")
  }

  const latestCountLabel = useMemo(() => {
    if (!meetings.length) return "No saved meetings yet"
    return `${meetings.length} saved meetings`
  }, [meetings.length])

  return (
    <>
      <Show when="signed-in">
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />

          <main className="flex-1 ml-64 px-6 py-8">
            <div className="mx-auto max-w-7xl space-y-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <Button variant="outline" size="sm" asChild className="mb-2">
                    <Link href="/dashboard">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Link>
                  </Button>
                  <Badge variant="secondary" className="w-fit">Meeting intake</Badge>
                  <h1 className="text-3xl font-bold tracking-tight">MeetingFlow Meetings</h1>
                  <p className="max-w-2xl text-muted-foreground">
                    Upload audio/video, review transcript output, and send it directly to task extraction.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2" onClick={sendToDashboard} disabled={!transcript.trim()}>
                    <Upload className="h-4 w-4" />
                    Send to dashboard
                  </Button>
                  <Button className="gap-2" onClick={sendToDashboard} disabled={!transcript.trim()}>
                    <Sparkles className="h-4 w-4" />
                    Start extraction
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="wm-card border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AudioLines className="h-5 w-5 text-primary" />
                      Meeting Intake Flow
                    </CardTitle>
                    <CardDescription>Upload-first workflow with local transcription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-5">
                      <AudioUpload onTranscript={handleUploadedTranscript} />
                    </div>

                    {transcript.trim() && (
                      <div className="mb-6 rounded-2xl border border-border/70 bg-background/60 p-4">
                        <p className="mb-2 text-sm font-medium">Transcript preview</p>
                        <p className="line-clamp-5 text-sm text-muted-foreground">{transcript}</p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3">
                          <Mic className="h-4 w-4 text-primary" />
                          Audio / video upload
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Drop meeting recordings here before transcription. Uploaded transcript can be sent straight to extraction.
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
                      <h3 className="font-semibold">Meeting pipeline</h3>
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

                <Card className="wm-card border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      Recent meetings
                    </CardTitle>
                    <CardDescription>{latestCountLabel}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingHistory ? (
                      <p className="text-sm text-muted-foreground">Loading meeting history...</p>
                    ) : null}

                    {!isLoadingHistory && meetings.length === 0 ? (
                      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
                        No meetings saved yet. Extract and save tasks from the dashboard to populate this history.
                      </div>
                    ) : null}

                    {meetings.map((meeting) => (
                      <div key={meeting.id} className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{meeting.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {meeting.createdAt ? new Date(meeting.createdAt).toLocaleString() : "Unknown date"}
                            </div>
                          </div>
                          <Badge variant={meeting.taskCount > 0 ? "default" : "secondary"}>
                            {meeting.taskCount} tasks
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </Show>

      <Show when="signed-out">
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Sign in required</h2>
            <p className="mb-4 text-sm text-muted-foreground">Please sign in to access your meetings.</p>
            <Button asChild>
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </Show>
    </>
  )
}
