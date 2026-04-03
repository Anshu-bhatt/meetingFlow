"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import AudioUpload from "@/components/dashboard/audio-upload"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { AudioLines, CalendarDays, Mic, PlayCircle, Sparkles, Upload } from "lucide-react"
import { fetchMeetings, fetchWorkspaceTasksRaw, type BackendMeeting } from "@/lib/meetings-api"
import { WORKSPACE_DATA_CHANGED_EVENT } from "@/lib/workspace-sync"
import { useLocalAuth } from "@/lib/local-auth"
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
  const { getToken, isLoaded, userId } = useLocalAuth()
  const [transcript, setTranscript] = useState("")
  const [meetings, setMeetings] = useState<MeetingSummary[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const loadMeetingHistory = useCallback(async () => {
    setIsLoadingHistory(true)

    try {
      const token = await getToken().catch(() => null)
      const [rows, allTasks] = await Promise.all([fetchMeetings(token), fetchWorkspaceTasksRaw(token)])

      const taskCountsByMeeting = allTasks.reduce<Record<string, number>>((acc, task) => {
        if (task.meeting_id) {
          acc[task.meeting_id] = (acc[task.meeting_id] || 0) + 1
        }
        return acc
      }, {})

      const withTaskCounts = rows.map((meeting: BackendMeeting) => ({
        id: meeting.id,
        title: meeting.title || "Untitled meeting",
        createdAt: meeting.created_at || "",
        taskCount: taskCountsByMeeting[meeting.id] || 0,
      }))

      setMeetings(withTaskCounts)
    } catch (error) {
      console.error("Failed loading meetings", error)
      toast.error("Could not load meeting history")
    } finally {
      setIsLoadingHistory(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded || !userId) {
      return
    }
    void loadMeetingHistory()
  }, [isLoaded, userId, loadMeetingHistory])

  useEffect(() => {
    const onWorkspaceSync = () => {
      void loadMeetingHistory()
    }
    window.addEventListener(WORKSPACE_DATA_CHANGED_EVENT, onWorkspaceSync)
    return () => window.removeEventListener(WORKSPACE_DATA_CHANGED_EVENT, onWorkspaceSync)
  }, [loadMeetingHistory])

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void loadMeetingHistory()
      }
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
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
    <div className="min-h-screen w-full px-6 py-6 lg:px-10 lg:py-8">
      <div className="w-full space-y-8">
        <DashboardPageHeader
          backHref="/dashboard"
          backLabel="Back"
          title="MeetingFlow Meetings"
          description="Upload audio/video, review transcript output, and send it directly to task extraction."
          badge={<Badge variant="secondary" className="w-fit">Meeting intake</Badge>}
          end={
            <>
              <Button variant="outline" className="gap-2" onClick={sendToDashboard} disabled={!transcript.trim()}>
                <Upload className="h-4 w-4" />
                Send to dashboard
              </Button>
              <Button className="gap-2" onClick={sendToDashboard} disabled={!transcript.trim()}>
                <Sparkles className="h-4 w-4" />
                Start extraction
              </Button>
            </>
          }
        />

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
                <div className="interactive-surface mb-6 rounded-2xl border-2 border-border bg-background/60 p-4">
                  <p className="mb-2 text-sm font-medium">Transcript preview</p>
                  <p className="line-clamp-5 text-sm text-muted-foreground">{transcript}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="interactive-surface rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Mic className="h-4 w-4 text-primary" />
                    Audio / video upload
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Drop meeting recordings here before transcription. Uploaded transcript can be sent straight to extraction.
                  </p>
                </div>
                <div className="interactive-surface rounded-2xl border-2 border-border bg-secondary/30 p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    Live meeting mode
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    A future real-time mode will capture spoken action items as they happen during the meeting.
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h3 className="font-semibold">Meeting pipeline</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {meetingFlow.map((step, index) => (
                    <div
                      key={step}
                      className="interactive-surface flex items-center gap-3 rounded-xl border-2 border-border/80 bg-background/60 px-4 py-3"
                    >
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
                <div className="interactive-surface rounded-2xl border-2 border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                  No meetings saved yet. Extract and save tasks from the dashboard to populate this history.
                </div>
              ) : null}

              {meetings.map((meeting) => (
                <div key={meeting.id} className="interactive-surface rounded-2xl border-2 border-border bg-secondary/30 p-4">
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
    </div>
  )
}
