"use client"

import { useState, useCallback, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AIInput } from "@/components/dashboard/ai-input"
import { ExtractedTasks } from "@/components/dashboard/extracted-tasks"
import { TaskTable } from "@/components/dashboard/task-table"
import { DashboardPlan } from "@/components/dashboard/dashboard-plan"
import { toast } from "sonner"
import type { Task } from "@/lib/types"


export default function DashboardPage() {
  const STORAGE_KEY = "meetflow.savedTasks"

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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const dedupeTasks = useCallback((tasks: Task[]) => {
    const seen = new Set<string>()

    return tasks.filter((task) => {
      const key = `${task.title.trim().toLowerCase()}|${(task.assignee || "").trim().toLowerCase()}|${task.deadline ?? ""}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }, [])

  // Persist saved tasks locally
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeTasks(savedTasks)))
    } catch (error) {
      console.error("Error saving tasks:", error)
    }
  }, [savedTasks, dedupeTasks])

  // Calculate stats
  const stats = {
    total: savedTasks.length,
    completed: savedTasks.filter(t => t.completed).length,
    pending: savedTasks.filter(t => !t.completed).length,
    overdue: savedTasks.filter(t => {
      if (t.completed || !t.deadline) return false
      return new Date(t.deadline) < new Date()
    }).length,
  }

  // Handle AI extraction
  const handleExtract = useCallback(async (transcript: string) => {
    setIsLoading(true)

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/extract-tasks`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }))
        throw new Error(errorData.error || "Task extraction failed")
      }

      const data: { tasks: Task[] } = await response.json()
      const uniqueTasks = data.tasks.filter((task, index, list) => {
        const key = `${task.title.toLowerCase()}|${(task.assignee || "").toLowerCase()}|${task.deadline ?? ""}`
        return list.findIndex((candidate) => {
          const candidateKey = `${candidate.title.toLowerCase()}|${(candidate.assignee || "").toLowerCase()}|${candidate.deadline ?? ""}`
          return candidateKey === key
        }) === index
      })

      setExtractedTasks(uniqueTasks)

      if (!uniqueTasks.length) {
        toast.info("No clear tasks found", {
          description: "Try adding more explicit action items, owners, and deadlines.",
        })
        return
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
  }, [])

  // Update extracted task
  const handleUpdateExtracted = useCallback((id: string, updates: Partial<Task>) => {
    setExtractedTasks(prev => 
      prev.map(task => task.id === id ? { ...task, ...updates } : task)
    )
  }, [])

  // Delete extracted task
  const handleDeleteExtracted = useCallback((id: string) => {
    setExtractedTasks(prev => prev.filter(task => task.id !== id))
    toast.info("Task removed")
  }, [])

  // Save all extracted tasks to backend
  const handleSaveAll = useCallback(async () => {
    try {
      setIsSaving(true)
      setSavedTasks(prev => dedupeTasks([...extractedTasks, ...prev]))
      setExtractedTasks([])

      toast.success("All tasks saved!", {
        description: "Tasks have been added to your browser storage.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save tasks"
      toast.error("Could not save tasks", {
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }, [extractedTasks, dedupeTasks])

  // Toggle task completion locally
  const handleToggleComplete = useCallback(async (id: string) => {
    setSavedTasks(prev => 
      prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    )
  }, [])

  // Delete saved task locally
  const handleDeleteSaved = useCallback(async (id: string) => {
    setSavedTasks(prev => prev.filter(task => task.id !== id))
    toast.info("Task deleted")
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Extract and manage tasks from your meetings
            </p>
          </div>

          <div className="mb-8">
            <StatsCards stats={stats} />
          </div>

          <DashboardPlan />

          <div className="mb-8">
            <AIInput onExtract={handleExtract} isLoading={isLoading} />
          </div>

          {extractedTasks.length > 0 && (
            <div className="mb-8">
              <ExtractedTasks
                tasks={extractedTasks}
                onUpdateTask={handleUpdateExtracted}
                onDeleteTask={handleDeleteExtracted}
                onSaveAll={handleSaveAll}
                isSaving={isSaving}
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
