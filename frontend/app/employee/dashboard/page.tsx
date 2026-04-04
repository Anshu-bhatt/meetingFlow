"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckSquare, Clock3, LogOut, Users, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { fetchAllTasks } from "@/lib/meetings-api"
import type { Task } from "@/lib/types"

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect unauthenticated users after auth state resolves.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/sign-in")
    }
  }, [authLoading, user, router])

  // Check auth and load tasks
  useEffect(() => {
    if (authLoading || !user) return
    
    if (user.role !== "employee") {
      router.replace("/dashboard")
      return
    }

    const loadTasksData = async () => {
      try {
        setLoading(true)
        const allTasks = await fetchAllTasks()
        
        // Filter tasks by assignee (match login_id or name)
        const userLoginId = user.login_id.toLowerCase()
        const userLocalPart = userLoginId.split("@")[0]
        const numericSuffix = (userLocalPart.match(/(\d+)$/) || [])[1] || ""
        const legacyEmployeeAlias = numericSuffix ? `employee${numericSuffix}` : "employee"
        const userName = user.name?.toLowerCase() || ""
        
        const assignedTasks = allTasks.filter(task => {
          const taskAssignee = (task.assignee || "").toLowerCase()
          const compactAssignee = taskAssignee.replace(/\s+/g, "")
          return (
            taskAssignee === userLoginId ||
            taskAssignee === userName ||
            compactAssignee === userLocalPart ||
            compactAssignee === legacyEmployeeAlias
          )
        })
        
        setTasks(assignedTasks)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks")
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    loadTasksData()
  }, [authLoading, user, router])

  const handleSignOut = async () => {
    await logout()
    router.push("/")
  }

  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length

  if (authLoading || !user) {
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name || user.login_id}</h1>
            <p className="text-muted-foreground">
              {totalTasks > 0 ? `You have ${totalTasks} assigned task(s) to manage.` : "No tasks assigned yet."}
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

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Total tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckSquare className="h-4 w-4 text-green-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">{Math.round((completedTasks/totalTasks)*100) || 0}% done</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4 w-4 text-amber-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overdueTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Past deadline</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks table */}
        <Card>
          <CardHeader>
            <CardTitle>My assigned tasks</CardTitle>
            <CardDescription>Tasks filtered by your login ID and assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading tasks...</p>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks assigned to you yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Tasks will appear here once team members assign work to you.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deadline</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">{task.title}</td>
                        <td className="py-3 px-4">
                          <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Low" ? "outline" : "secondary"}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={task.completed ? "default" : "outline"}>
                            {task.completed ? "Completed" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
