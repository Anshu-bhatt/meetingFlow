"use client"

import { useState, useCallback } from "react"
import { RedirectToSignIn, Show, useAuth } from "@clerk/nextjs"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AIInput } from "@/components/dashboard/ai-input"
import { ExtractedTasks } from "@/components/dashboard/extracted-tasks"
import { TaskTable } from "@/components/dashboard/task-table"
import { toast } from "sonner"
import type { Task } from "@/lib/types"

// Mock initial tasks
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review Q4 budget proposal and send feedback to finance team",
    assignee: "Sarah Smith",
    priority: "High",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
  },
  {
    id: "2",
    title: "Schedule follow-up call with Acme Corp client",
    assignee: "Mike Johnson",
    priority: "Medium",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed: true,
  },
  {
    id: "3",
    title: "Update project timeline in Notion",
    assignee: "Alex Chen",
    priority: "Low",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
  },
  {
    id: "4",
    title: "Prepare presentation for Monday standup",
    assignee: "John Doe",
    priority: "High",
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
  },
]

export default function DashboardPage() {
  const { getToken } = useAuth()
  const [savedTasks, setSavedTasks] = useState<Task[]>(initialTasks)
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Calculate stats
  const stats = {
    total: savedTasks.length,
    completed: savedTasks.filter(t => t.completed).length,
    pending: savedTasks.filter(t => !t.completed).length,
    overdue: savedTasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length,
  }

  // Handle AI extraction
  const handleExtract = useCallback(async (transcript: string) => {
    setIsLoading(true)

    try {
      const token = await getToken()

      if (!token) {
        throw new Error("You are not authenticated")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/ai/extract-tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transcript }),
        }
      )

      if (!response.ok) {
        throw new Error("Task extraction failed")
      }

      const data: { tasks: Task[] } = await response.json()
      setExtractedTasks(data.tasks)

      toast.success(`${data.tasks.length} tasks extracted successfully!`, {
        description: "Review and customize tasks before saving.",
      })
    } catch {
      toast.error("Could not extract tasks", {
        description: "Please try again after signing in.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

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

  // Save all extracted tasks
  const handleSaveAll = useCallback(() => {
    setSavedTasks(prev => [...extractedTasks, ...prev])
    setExtractedTasks([])
    toast.success("All tasks saved!", {
      description: "Tasks have been added to your task list.",
    })
  }, [extractedTasks])

  // Toggle task completion
  const handleToggleComplete = useCallback((id: string) => {
    setSavedTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  // Delete saved task
  const handleDeleteSaved = useCallback((id: string) => {
    setSavedTasks(prev => prev.filter(task => task.id !== id))
    toast.info("Task deleted")
  }, [])

  return (
    <>
      <Show when="signed-in">
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
      </Show>

      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  )
}
