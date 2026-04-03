"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AIInput } from "@/components/dashboard/ai-input"
import AudioUpload from "@/components/dashboard/audio-upload"
import { ExtractedTasks } from "@/components/dashboard/extracted-tasks"
import { TaskTable } from "@/components/dashboard/task-table"
import { toast } from "sonner"
import type { Task } from "@/lib/types"
import {
  deleteTaskById,
  fetchAllTasks,
  saveMeetingWithTasks,
  updateTaskById,
} from "@/lib/meetings-api"
import { emitWorkspaceDataChanged } from "@/lib/workspace-sync"

type ExtractResponse = {
  tasks: Task[]
  meetingSummary?: string
  totalTasks?: number
  highPriorityCount?: number
  speakers_detected?: string[]
}

type ExtractionDraft = {
  transcript: string
  tasks: Task[]
  meetingSummary: string | null
  extractionStats: { totalTasks: number; highPriorityCount: number } | null
  speakersDetected: string[]
}

const TRANSCRIPT_KEY = "meetingflow.latestTranscript"
const EXTRACTION_DRAFT_KEY = "meetingflow.latestExtractionDraft"

const readExtractionDraft = (): ExtractionDraft | null => {
  try {
    const raw = window.localStorage.getItem(EXTRACTION_DRAFT_KEY)
    if (!raw) return null

    const draft = JSON.parse(raw) as Partial<ExtractionDraft>

    return {
      transcript: typeof draft.transcript === "string" ? draft.transcript : "",
      tasks: Array.isArray(draft.tasks) ? draft.tasks : [],
      meetingSummary: typeof draft.meetingSummary === "string" ? draft.meetingSummary : null,
      extractionStats: draft.extractionStats
        ? {
            totalTasks: draft.extractionStats.totalTasks ?? 0,
            highPriorityCount: draft.extractionStats.highPriorityCount ?? 0,
          }
        : null,
      speakersDetected: Array.isArray(draft.speakersDetected) ? draft.speakersDetected : [],
    }
  } catch (error) {
    console.error("Error loading extracted task draft:", error)
    return null
  }
}

const persistExtractionDraft = (draft: ExtractionDraft) => {
  try {
    window.localStorage.setItem(EXTRACTION_DRAFT_KEY, JSON.stringify(draft))
  } catch (error) {
    console.error("Error caching extracted task draft:", error)
  }
}

export default function DashboardPage() {
  const { getToken, isLoaded, userId } = useAuth()

  const [savedTasks, setSavedTasks] = useState<Task[]>([])
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([])
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null)
  const [extractionStats, setExtractionStats] = useState<{ totalTasks: number; highPriorityCount: number } | null>(null)
  const [speakersDetected, setSpeakersDetected] = useState<string[]>([])
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
    if (!isLoaded || !userId) {
      return
    }
    void refreshSavedTasks()
  }, [isLoaded, userId, refreshSavedTasks])

  useEffect(() => {
    try {
      const latestTranscript = window.localStorage.getItem(TRANSCRIPT_KEY)
      const latestDraft = readExtractionDraft()

      if (latestDraft) {
        setUploadedTranscript(latestDraft.transcript || latestTranscript || "")
        setExtractedTasks(latestDraft.tasks)
        setExtractionSummary(latestDraft.meetingSummary)
        setExtractionStats(latestDraft.extractionStats)
        setSpeakersDetected(latestDraft.speakersDetected)
        return
      }

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
      setSpeakersDetected(data.speakers_detected || [])
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

      persistExtractionDraft({
        transcript,
        tasks: uniqueTasks,
        meetingSummary: data.meetingSummary || null,
        extractionStats: {
          totalTasks: data.totalTasks ?? uniqueTasks.length,
          highPriorityCount: data.highPriorityCount ?? uniqueTasks.filter((task) => task.priority === "High").length,
        },
        speakersDetected: data.speakers_detected || [],
      })

      if (!uniqueTasks.length) {
        toast.info("No clear tasks found", {
          description: "Try adding more explicit action items, owners, and deadlines.",
        })
        return
      }

      await saveMeetingWithTasks(
        {
          title: `Meeting - ${new Date().toLocaleString()}`,
          transcript,
          tasks: uniqueTasks,
        },
        token,
      )

      await refreshSavedTasks()
      emitWorkspaceDataChanged()

      toast.success(`${uniqueTasks.length} tasks extracted and saved`, {
        description: "Tasks are now visible on Dashboard, Tasks, and Meetings pages.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not extract tasks"
      toast.error("Could not extract tasks", {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [getToken, makeTaskFingerprint, refreshSavedTasks])

  const handleUpdateExtracted = useCallback((id: string, updates: Partial<Task>) => {
    setExtractedTasks((previous) => {
      const nextTasks = previous.map((task) => task.id === id ? { ...task, ...updates } : task)
      persistExtractionDraft({
        transcript: uploadedTranscript,
        tasks: nextTasks,
        meetingSummary: extractionSummary,
        extractionStats,
        speakersDetected,
      })
      return nextTasks
    })
  }, [extractionStats, extractionSummary, speakersDetected, uploadedTranscript])

  const handleDeleteExtracted = useCallback((id: string) => {
    setExtractedTasks((previous) => {
      const nextTasks = previous.filter((task) => task.id !== id)
      persistExtractionDraft({
        transcript: uploadedTranscript,
        tasks: nextTasks,
        meetingSummary: extractionSummary,
        extractionStats,
        speakersDetected,
      })
      return nextTasks
    })
    toast.info("Task removed")
  }, [extractionStats, extractionSummary, speakersDetected, uploadedTranscript])

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
      emitWorkspaceDataChanged()

      persistExtractionDraft({
        transcript,
        tasks: extractedTasks,
        meetingSummary: extractionSummary,
        extractionStats,
        speakersDetected,
      })

      toast.success("All tasks saved", {
        description: "Tasks have been synced across Dashboard, Tasks, and Meetings.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save tasks"
      toast.error("Could not save tasks", {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [extractedTasks, extractionStats, extractionSummary, getToken, refreshSavedTasks, speakersDetected, uploadedTranscript])

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
      emitWorkspaceDataChanged()
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
      emitWorkspaceDataChanged()
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
    <div className="min-h-screen w-full px-6 py-6 lg:px-10 lg:py-8">
      <div className="w-full space-y-8">
        <DashboardPageHeader
          backHref="/"
          backLabel="Back"
          title="MeetingFlow Dashboard"
          description="Upload meeting files, extract tasks, and track execution in one place"
        />

        <StatsCards stats={stats} />

        <AudioUpload onTranscript={handleTranscriptUpload} />

        <AIInput
          onExtract={handleExtract}
          isLoading={isLoading}
          initialTranscript={uploadedTranscript}
        />

        {(extractedTasks.length > 0 || extractionSummary) && (
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
        )}

        <TaskTable
          tasks={savedTasks}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteSaved}
        />

        {isSyncingTasks && (
          <p className="text-xs text-muted-foreground">Refreshing tasks...</p>
        )}
      </div>
    </div>
  )
}
