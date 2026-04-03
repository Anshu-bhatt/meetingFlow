"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AIInput } from "@/components/dashboard/ai-input"
import AudioUpload from "@/components/dashboard/audio-upload"
import { ExtractedTasks } from "@/components/dashboard/extracted-tasks"
import { TaskTable } from "@/components/dashboard/task-table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import type { Task } from "@/lib/types"

type AuthUser = {
  login_id: string
  name: string
  role: string
}

export default function DashboardPage() {
  const router = useRouter()

  const STORAGE_KEY = "meetingflow.savedTasks"
  const TRANSCRIPT_KEY = "meetingflow.latestTranscript"

  const [savedTasks, setSavedTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") {
      return []
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw) as Task[]
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error("Error loading saved tasks:", error)
      return []
    }
  })

  const [extractedTasks, setExtractedTasks] = useState<Task[]>([])
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null)
  const [extractionStats, setExtractionStats] = useState<{ totalTasks: number; highPriorityCount: number } | null>(null)
  const [speakersDetected, setSpeakersDetected] = useState<string[]>([])
  const [uploadedTranscript, setUploadedTranscript] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
          credentials: "include",
        })
        const data = await response.json().catch(() => ({} as { user?: AuthUser | null }))

        if (!data.user) {
          setAuthState("unauthenticated")
          router.replace("/sign-in")
          return
        }

        if (data.user.role === "employee") {
          router.replace("/employee/dashboard")
          return
        }

        setCurrentUser(data.user)
        setAuthState("authenticated")
      } catch (error) {
        console.error("[Dashboard] Session lookup failed:", error)
        setAuthState("unauthenticated")
        router.replace("/sign-in")
      }
    }

    loadSession()
  }, [router])

  const makeTaskFingerprint = useCallback((task: Pick<Task, "title" | "assignee" | "deadline">) => {
    return `${task.title.trim().toLowerCase()}|${(task.assignee || "").trim().toLowerCase()}|${task.deadline ?? ""}`
  }, [])

  useEffect(() => {
    try {
      const existingKeys = new Set<string>()
      const deduped = savedTasks.filter((task) => {
        const key = makeTaskFingerprint(task)
        if (existingKeys.has(key)) return false
        existingKeys.add(key)
        return true
      })
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
    } catch (error) {
      console.error("Error saving tasks:", error)
    }
  }, [savedTasks, makeTaskFingerprint])

  const stats = {
    total: savedTasks.length,
    completed: savedTasks.filter(t => t.completed).length,
    pending: savedTasks.filter(t => !t.completed).length,
    overdue: savedTasks.filter(t => {
      if (t.completed || !t.deadline) return false
      return new Date(t.deadline) < new Date()
    }).length,
  }

  useEffect(() => {
    try {
      const latestTranscript = window.localStorage.getItem(TRANSCRIPT_KEY)
      if (latestTranscript?.trim()) {
        setUploadedTranscript(latestTranscript)
      }
    } catch (error) {
      console.error("Error loading latest transcript:", error)
    }
  }, [])

  const handleExtract = useCallback(async (transcript: string) => {
    console.log("[Dashboard] handleExtract called with transcript length:", transcript.length)
    setIsLoading(true)
    setExtractedTasks([])
    setExtractionSummary(null)
    setExtractionStats(null)
    setSpeakersDetected([])

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/extract-tasks`
      console.log("[Dashboard] Calling endpoint:", endpoint)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ transcript }),
      })

      console.log("[Dashboard] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }))
        console.error("[Dashboard] API error:", errorData)
        throw new Error(errorData.error || "Task extraction failed")
      }

      const data: {
        tasks: Task[]
        meetingSummary?: string
        totalTasks?: number
        highPriorityCount?: number
        speakers_detected?: string[]
      } = await response.json()

      console.log("[Dashboard] Received data:", data)

      const uniqueTasks = data.tasks.filter((task, index, list) => {
        const key = makeTaskFingerprint(task)
        return list.findIndex((candidate) => makeTaskFingerprint(candidate) === key) === index
      })

      setExtractedTasks(uniqueTasks)
      setSpeakersDetected(data.speakers_detected || [])
      setExtractionSummary(data.meetingSummary || null)
      setExtractionStats({
        totalTasks: data.totalTasks ?? uniqueTasks.length,
        highPriorityCount: data.highPriorityCount ?? uniqueTasks.filter((task) => task.priority === "High").length,
      })

      if (!uniqueTasks.length) {
        toast.info("No clear tasks found", {
          description: "Try adding more explicit action items, owners, and deadlines.",
        })
        return
      }

      try {
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/meetings/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: `Meeting - ${new Date().toLocaleString()}`,
            transcript,
            tasks: uniqueTasks,
          }),
        })

        if (!saveResponse.ok) {
          const saveError = await saveResponse.json().catch(() => ({} as { error?: string }))
          console.error("Save failed:", saveError)
          toast.warning("Tasks extracted but not saved to database", {
            description: saveError.error || "Database save failed",
          })
        } else {
          const saveData = await saveResponse.json()
          console.log("✅ Tasks saved to database:", saveData)
          toast.success("Tasks extracted and saved to database!", {
            description: `${saveData.tasks?.length || 0} tasks saved`,
          })
        }
      } catch (dbError) {
        console.error("Database save error:", dbError)
        toast.error("Could not save to database", {
          description: dbError instanceof Error ? dbError.message : "Unknown error",
        })
      }

      toast.success(`${uniqueTasks.length} tasks extracted successfully!`, {
        description: "Review and customize tasks before saving.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not extract tasks"
      toast.error("Could not extract tasks", {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [makeTaskFingerprint])

  const handleUpdateExtracted = useCallback((id: string, updates: Partial<Task>) => {
    setExtractedTasks(prev =>
      prev.map(task => task.id === id ? { ...task, ...updates } : task)
    )
  }, [])

  const handleDeleteExtracted = useCallback((id: string) => {
    setExtractedTasks(prev => prev.filter(task => task.id !== id))
    toast.info("Task removed")
  }, [])

  const handleSaveAll = useCallback(() => {
    setSavedTasks(prev => {
      const existingKeys = new Set(prev.map((task) => makeTaskFingerprint(task)))
      const toAdd = extractedTasks.filter((task) => {
        const key = makeTaskFingerprint(task)
        if (existingKeys.has(key)) {
          return false
        }
        existingKeys.add(key)
        return true
      })

      return [...toAdd, ...prev]
    })
    setExtractedTasks([])

    toast.success("All tasks saved!", {
      description: "Tasks have been added to your browser storage.",
    })
  }, [extractedTasks, makeTaskFingerprint])

  const handleToggleComplete = useCallback((id: string) => {
    setSavedTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  const handleDeleteSaved = useCallback((id: string) => {
    setSavedTasks(prev => prev.filter(task => task.id !== id))
    toast.info("Task deleted")
  }, [])

  const handleTranscriptUpload = useCallback(async (transcript: string) => {
    setUploadedTranscript(transcript)

    try {
      window.localStorage.setItem(TRANSCRIPT_KEY, transcript)
    } catch (error) {
      console.error("Error caching transcript:", error)
    }

    await handleExtract(transcript)
  }, [handleExtract])

  if (authState !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <div className="mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold mb-1">MeetingFlow Dashboard</h1>
            <p className="text-muted-foreground">
              Upload meeting files, extract tasks, and track execution in one place.
            </p>
            {currentUser ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Signed in as {currentUser.name} ({currentUser.role})
              </p>
            ) : null}
          </div>

          <div className="mb-8">
            <StatsCards stats={stats} />
          </div>

          <div className="mb-8">
            <AudioUpload onTranscript={handleTranscriptUpload} />
          </div>

          <div className="mb-8">
            <AIInput
              onExtract={handleExtract}
              isLoading={isLoading}
              initialTranscript={uploadedTranscript}
            />
          </div>

          {(extractedTasks.length > 0 || extractionSummary) && (
            <div className="mb-8">
              <ExtractedTasks
                tasks={extractedTasks}
                meetingSummary={extractionSummary}
                totalTasks={extractionStats?.totalTasks ?? extractedTasks.length}
                highPriorityCount={extractionStats?.highPriorityCount ?? extractedTasks.filter((task) => task.priority === "High").length}
                speakersDetected={speakersDetected}
                onUpdateTask={handleUpdateExtracted}
                onDeleteTask={handleDeleteExtracted}
                onSaveAll={handleSaveAll}
              />
            </div>
          )}

          <TaskTable
            tasks={savedTasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteSaved}
          />
        </div>
      </main>
    </div>
  )
}
