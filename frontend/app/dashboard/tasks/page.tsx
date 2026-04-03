"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TaskTable } from "@/components/dashboard/task-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import type { Task } from "@/lib/types"
import { deleteTaskById, fetchAllTasks, updateTaskById } from "@/lib/meetings-api"
import { WORKSPACE_DATA_CHANGED_EVENT, emitWorkspaceDataChanged } from "@/lib/workspace-sync"
import { useLocalAuth } from "@/lib/local-auth"
import { toast } from "sonner"

export default function TasksPage() {
  const { getToken, isLoaded, userId } = useLocalAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadTasks = useCallback(async () => {
    setIsLoading(true)

    try {
      const token = await getToken().catch(() => null)
      const loaded = await fetchAllTasks(token)
      setTasks(loaded)
    } catch (error) {
      console.error("Failed to load tasks", error)
      toast.error("Could not load tasks")
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded || !userId) {
      return
    }
    void loadTasks()
  }, [isLoaded, userId, loadTasks])

  useEffect(() => {
    const onWorkspaceSync = () => {
      void loadTasks()
    }
    window.addEventListener(WORKSPACE_DATA_CHANGED_EVENT, onWorkspaceSync)
    return () => window.removeEventListener(WORKSPACE_DATA_CHANGED_EVENT, onWorkspaceSync)
  }, [loadTasks])

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void loadTasks()
      }
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [loadTasks])

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter((task) => task.completed).length,
      pending: tasks.filter((task) => !task.completed).length,
      overdue: tasks.filter((task) => {
        if (task.completed || !task.deadline) return false
        return new Date(task.deadline) < new Date()
      }).length,
    }
  }, [tasks])

  const handleToggleComplete = useCallback(async (id: string) => {
    const current = tasks.find((task) => task.id === id)
    if (!current) return

    const nextCompleted = !current.completed

    setTasks((previous) =>
      previous.map((task) => task.id === id ? { ...task, completed: nextCompleted } : task),
    )

    try {
      const token = await getToken().catch(() => null)
      await updateTaskById(id, { completed: nextCompleted }, token)
      emitWorkspaceDataChanged()
    } catch (error) {
      setTasks((previous) =>
        previous.map((task) => task.id === id ? { ...task, completed: current.completed } : task),
      )

      const message = error instanceof Error ? error.message : "Could not update task"
      toast.error("Task update failed", { description: message })
    }
  }, [getToken, tasks])

  const handleDeleteTask = useCallback(async (id: string) => {
    const previous = tasks
    setTasks((current) => current.filter((task) => task.id !== id))

    try {
      const token = await getToken().catch(() => null)
      await deleteTaskById(id, token)
      emitWorkspaceDataChanged()
      toast.success("Task deleted")
    } catch (error) {
      setTasks(previous)
      const message = error instanceof Error ? error.message : "Could not delete task"
      toast.error("Delete failed", { description: message })
    }
  }, [getToken, tasks])

  return (
    <div className="min-h-screen w-full px-6 py-6 lg:px-10 lg:py-8">
      <div className="w-full space-y-8">
        <DashboardPageHeader
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          title="Task Management"
          description="All extracted tasks are synced from your meeting history."
        />

        <StatsCards stats={stats} />

        <TaskTable
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
        />

        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading tasks...</p>
        )}
      </div>
    </div>
  )
}
