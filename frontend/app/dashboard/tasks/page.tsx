"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Show, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TaskTable } from "@/components/dashboard/task-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/types"
import { deleteTaskById, fetchAllTasks, updateTaskById } from "@/lib/meetings-api"
import { toast } from "sonner"

export default function TasksPage() {
  const { getToken } = useAuth()
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
    void loadTasks()
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
      toast.success("Task deleted")
    } catch (error) {
      setTasks(previous)
      const message = error instanceof Error ? error.message : "Could not delete task"
      toast.error("Delete failed", { description: message })
    }
  }, [getToken, tasks])

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
                    <Link href="/dashboard">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>
                <h1 className="text-2xl font-bold mb-1">Task Management</h1>
                <p className="text-muted-foreground">All extracted tasks are synced from your meeting history.</p>
              </div>

              <div className="mb-8">
                <StatsCards stats={stats} />
              </div>

              <TaskTable
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
              />

              {isLoading && (
                <p className="mt-3 text-xs text-muted-foreground">Loading tasks...</p>
              )}
            </div>
          </main>
        </div>
      </Show>

      <Show when="signed-out">
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Sign in required</h2>
            <p className="mb-4 text-sm text-muted-foreground">Please sign in to access your tasks.</p>
            <Button asChild>
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </Show>
    </>
  )
}
