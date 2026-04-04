"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckSquare, Clock3, LogOut, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { EmployeeAnalytics } from "@/components/employee/employee-analytics"

type AuthUser = {
  login_id: string
  name: string
  role: string
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
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
          const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/tasks`, {
            credentials: "include",
          })
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json()
            setTasks(tasksData.tasks || [])
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

  const handleSignOut = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/logout`, {
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
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">Employee portal</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">
              Your assigned tasks, meeting summaries, and team updates will appear here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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
      </div>
    </main>
  )
}
