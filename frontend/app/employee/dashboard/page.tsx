"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckSquare, Clock3, LogOut, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { EmployeeAnalytics } from "@/components/employee/employee-analytics"
import { TaskTable } from "@/components/dashboard/task-table"

type AuthUser = {
  login_id: string
  name: string
  role: string
  google_token_expires_at?: string
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isGoogleConnected = !!user?.google_token_expires_at;
  const googleAuthUrl = "/api/auth/google";

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`/api/auth/me`, {
          credentials: "include",
        })
          if (!response.ok) {
            router.replace("/sign-in")
            return
          }

          const data = await response.json().catch(() => ({} as { user?: AuthUser | null }))

        if (!data.user) {
          router.replace("/sign-in")
          return
        }

        if (data.user.role !== "employee") {
          router.replace("/dashboard")
          return
        }

        setUser(data.user)

        try {
          const tasksRes = await fetch(`/api/tasks`, {
            credentials: "include",
          })
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json()
            setTasks(
              tasksData.tasks?.map((t: any) => ({
                ...t,
                assignee: t.assignee ?? t.assignee_name ?? "Unassigned",
                completed: t.status === "completed",
              })) || []
            )
          }
        } catch (taskErr) {
          console.error("Failed to fetch tasks", taskErr)
        }
        } catch {
        router.replace("/sign-in")
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [router])

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Toggle logically mapping "completed" vs "pending"
    const newStatus = task.completed ? "pending" : "completed";
    
    // Optimistic UI state overwrite so React drives live visual graphs simultaneously 
    const newTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, completed: newStatus === "completed" } : t
    );
    setTasks(newTasks);

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  }

  const handleSignOut = async () => {
    await fetch(`/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    router.push("/")
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading employee dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-xl md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit">Employee portal</Badge>
              {isGoogleConnected ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <div className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Calendar Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <div className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Calendar Disconnected
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">
              Your assigned tasks, meeting summaries, and team updates will appear here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!isGoogleConnected && (
              <Button variant="default" asChild className="bg-blue-600 hover:bg-blue-700">
                <a href={googleAuthUrl}>
                  <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="mr-2 h-4 w-4" alt="Google" />
                  Connect Google Calendar
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <StatsCards stats={{
            total: tasks.length,
            completed: tasks.filter(t => t.status === "completed").length,
            pending: tasks.filter(t => t.status === "pending" || t.status === "in_progress").length,
            overdue: tasks.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) < new Date()).length
        }} />
        
        <EmployeeAnalytics tasks={tasks} />
        
        <div className="mt-8">
          <TaskTable 
            tasks={tasks} 
            onToggleComplete={handleToggleComplete} 
            onDeleteTask={() => {}} 
          />
        </div>
      </div>
    </main>
  )
}
