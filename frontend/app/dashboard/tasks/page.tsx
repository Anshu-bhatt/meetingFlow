"use client"

import { useEffect, useMemo, useState } from "react"
import { Show } from "@clerk/nextjs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TaskTable } from "@/components/dashboard/task-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/types"

const STORAGE_KEY = "meetingflow.savedTasks"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as Task[]
      if (Array.isArray(parsed)) {
        setTasks(parsed)
      }
    } catch (error) {
      console.error("Failed to load tasks", error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.error("Failed to persist tasks", error)
    }
  }, [tasks])

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

  const handleToggleComplete = (id: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  const handleDeleteTask = (id: string) => {
    setTasks((previous) => previous.filter((task) => task.id !== id))
  }

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
                <p className="text-muted-foreground">Review, complete, and clean up your extracted action items.</p>
              </div>

              <div className="mb-8">
                <StatsCards stats={stats} />
              </div>

              <TaskTable
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
              />
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
