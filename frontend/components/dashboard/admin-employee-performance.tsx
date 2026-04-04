"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp } from "lucide-react"

import type { Task } from "@/lib/types"

interface AdminEmployeePerformanceProps {
  savedTasks: Task[]
  extractedTasks: Task[]
}

export function AdminEmployeePerformance({ savedTasks, extractedTasks }: AdminEmployeePerformanceProps) {
  const sourceAssignees = extractedTasks.length > 0 ? extractedTasks : savedTasks;
  const rawAssignees = Array.from(new Set(sourceAssignees.map(t => ((t.assignee as unknown as string) || (t as any).assignee_name || "Unassigned").trim()))).filter(Boolean)
  
  if (rawAssignees.length === 0) return null;

  const performanceData = rawAssignees.map(assignee => {
    const theirHistory = savedTasks.filter(t => ((t.assignee as unknown as string) || (t as any).assignee_name || "").trim().toLowerCase() === assignee.toLowerCase())
    const theirNew = extractedTasks.filter(t => ((t.assignee as unknown as string) || (t as any).assignee_name || "").trim().toLowerCase() === assignee.toLowerCase())

    const completed = theirHistory.filter(t => t.completed || (t as any).status === "completed").length
    const pendingHistory = theirHistory.filter(t => !t.completed && (t as any).status !== "completed").length
    
    const totalPending = pendingHistory + theirNew.length
    const totalAssigned = completed + totalPending
    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0
    const behind = totalAssigned > 0 && completionRate < 20 && totalPending > 3
    
    return {
      assignee,
      completed,
      pending: totalPending,
      total: totalAssigned,
      completionRate,
      behind
    }
  }).sort((a,b) => b.total - a.total)

  const underperformers = performanceData.filter(d => d.behind || (d.total > 0 && d.completed === 0))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="wm-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Employee Meeting Context</CardTitle>
          <CardDescription>
            Historical task productivity charted for assignees active in this meeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="assignee" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.2 }}
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "white" }} 
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar name="Productive (Completed)" dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar name="Assigned (Pending)" dataKey="pending" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="wm-card">
        <CardHeader>
          <CardTitle>Needs Attention</CardTitle>
          <CardDescription>
            Employees participating who are not completing historical tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {underperformers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-emerald-500">High Team Productivity</h3>
              <p className="text-sm text-muted-foreground mt-1">All employees in this meeting are actively executing assigned tasks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {underperformers.map((u, i) => (
                <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{u.assignee}</h4>
                      <p className="text-xs text-muted-foreground">
                        {u.completed} completed, {u.pending} pending.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
