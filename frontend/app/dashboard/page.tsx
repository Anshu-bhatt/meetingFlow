"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Show, useAuth } from "@clerk/nextjs"
import Link from "next/link"
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
import {
  deleteTaskById,
  fetchAllTasks,
  saveMeetingWithTasks,
  updateTaskById,
} from "@/lib/meetings-api"

type ExtractResponse = {
  tasks: Task[]
  meetingSummary?: string
  totalTasks?: number
  highPriorityCount?: number
}

export default function DashboardPage() {
  const { getToken } = useAuth()

  const TRANSCRIPT_KEY = "meetingflow.latestTranscript"

  const [savedTasks, setSavedTasks] = useState<Task[]>([])
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([])
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null)
  const [extractionStats, setExtractionStats] = useState<{ totalTasks: number; highPriorityCount: number } | null>(null)
  const [uploadedTranscript, setUploadedTranscript] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncingTasks, setIsSyncingTasks] = useState(false)

  const makeTaskFingerprint = useCallback((task: Pick<Task, "title" | "assignee" | "deadline">) => {
    return `${task.title.trim().toLowerCase()}|${(task.assignee || "").trim().toLowerCase()}|${task.deadline ?? ""}`
  }, [])

  const refreshSavedTasks = useCallback(async () => {
    setIsSyncingTasks(true)

    try {
      const token = await getToken().catch(() => null)
      const tasks = await fetchAllTasks(token)
      setSavedTasks(tasks)
    } catch (error) {
      console.error("Failed loading saved tasks:", error)
      toast.error("Could not load saved tasks")
    } finally {
      setIsSyncingTasks(false)
    }
  }, [getToken])

  useEffect(() => {
    void refreshSavedTasks()
  }, [refreshSavedTasks])

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

  const stats = useMemo(() => {
    return {
      total: savedTasks.length,
      completed: savedTasks.filter((task) => task.completed).length,
      pending: savedTasks.filter((task) => !task.completed).length,
      overdue: savedTasks.filter((task) => {
        if (task.completed || !task.deadline) return false
        return new Date(task.deadline) < new Date()
      }).length,
    }
  }, [savedTasks])

  const handleExtract = useCallback(async (transcript: string) => {
    setIsLoading(true)
    setExtractedTasks([])
    setExtractionSummary(null)
    setExtractionStats(null)

    try {
      const token = await getToken().catch(() => null)
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/extract-tasks`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }))
        throw new Error(errorData.error || "Task extraction failed")
      }

      const data: ExtractResponse = await response.json()
      const uniqueTasks = (data.tasks || []).filter((task, index, list) => {
        const key = makeTaskFingerprint(task)
        return list.findIndex((candidate) => makeTaskFingerprint(candidate) === key) === index
      })

      setExtractedTasks(uniqueTasks)
      setExtractionSummary(data.meetingSummary || null)
      setExtractionStats({
        totalTasks: data.totalTasks ?? uniqueTasks.length,
        highPriorityCount: data.highPriorityCount ?? uniqueTasks.filter((task) => task.priority === "High").length,
      })
      setUploadedTranscript(transcript)

      try {
        window.localStorage.setItem(TRANSCRIPT_KEY, transcript)
      } catch (error) {
        console.error("Error caching transcript:", error)
      }

      if (!uniqueTasks.length) {
        toast.info("No clear tasks found", {
          description: "Try adding more explicit action items, owners, and deadlines.",
        })
        return
      }

      toast.success(`${uniqueTasks.length} tasks extracted successfully!`, {
        description: "Review tasks and click Save All Tasks to publish them across pages.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not extract tasks"
      toast.error("Could not extract tasks", {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [getToken, makeTaskFingerprint])

  const handleUpdateExtracted = useCallback((id: string, updates: Partial<Task>) => {
    setExtractedTasks((previous) =>
      previous.map((task) => task.id === id ? { ...task, ...updates } : task),
    )
  }, [])

  const handleDeleteExtracted = useCallback((id: string) => {
    setExtractedTasks((previous) => previous.filter((task) => task.id !== id))
    toast.info("Task removed")
  }, [])

  const handleSaveAll = useCallback(async () => {
    if (!extractedTasks.length) {
      toast.info("No extracted tasks to save")
      return
    }

    const transcript = uploadedTranscript.trim()
    if (!transcript) {
      toast.error("Transcript is required", {
        description: "Upload a recording or paste transcript before saving tasks.",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = await getToken().catch(() => null)
      await saveMeetingWithTasks(
        {
          title: `Meeting - ${new Date().toLocaleString()}`,
          transcript,
          tasks: extractedTasks,
        },
        token,
      )

      setExtractedTasks([])
      await refreshSavedTasks()

      toast.success("Tasks saved", {
        description: "Dashboard, meetings, and tasks pages are now synced.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save tasks"
      toast.error("Could not save tasks", {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [extractedTasks, getToken, refreshSavedTasks, uploadedTranscript])

  const handleToggleComplete = useCallback(async (id: string) => {
    const current = savedTasks.find((task) => task.id === id)
    if (!current) return

    const nextValue = !current.completed

    setSavedTasks((previous) =>
      previous.map((task) => task.id === id ? { ...task, completed: nextValue } : task),
    )

    try {
      const token = await getToken().catch(() => null)
      await updateTaskById(id, { completed: nextValue }, token)
    } catch (error) {
      setSavedTasks((previous) =>
        previous.map((task) => task.id === id ? { ...task, completed: current.completed } : task),
      )

      const message = error instanceof Error ? error.message : "Could not update task"
      toast.error("Task update failed", { description: message })
    }
  }, [getToken, savedTasks])

  const handleDeleteSaved = useCallback(async (id: string) => {
    const previousTasks = savedTasks
    setSavedTasks((current) => current.filter((task) => task.id !== id))

    try {
      const token = await getToken().catch(() => null)
      await deleteTaskById(id, token)
      toast.info("Task deleted")
    } catch (error) {
      setSavedTasks(previousTasks)
      const message = error instanceof Error ? error.message : "Could not delete task"
      toast.error("Delete failed", { description: message })
    }
  }, [getToken, savedTasks])

  const handleTranscriptUpload = useCallback(async (transcript: string) => {
    setUploadedTranscript(transcript)

    try {
      window.localStorage.setItem(TRANSCRIPT_KEY, transcript)
    } catch (error) {
      console.error("Error caching transcript:", error)
    }

    await handleExtract(transcript)
  }, [handleExtract])

  return (
    <>
      <Show when="signed-in">
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
                  Upload meeting files, extract tasks, and track execution in one place
                </p>
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

              {isSyncingTasks && (
                <p className="mt-3 text-xs text-muted-foreground">Refreshing tasks...</p>
              )}
            </div>
          </main>
        </div>
      </Show>

      <Show when="signed-out">
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Sign in required</h2>
            <p className="mb-4 text-sm text-muted-foreground">Please sign in to access your dashboard.</p>
            <Button asChild>
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </Show>
    </>
  )
}
