"use client"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface EmployeeTask {
  id: string
  title: string
  status: string
  priority: string
  deadline: string
  created_at: string
}

export function EmployeeAnalytics({ tasks }: { tasks: EmployeeTask[] }) {
  const completed = tasks.filter((t) => t.status === "completed").length
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length
  const overdue = tasks.filter((t) => {
    return t.status !== "completed" && t.deadline && new Date(t.deadline) < new Date()
  }).length
  
  const pieData = [
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Overdue", value: overdue, color: "#ef4444" },
  ]

  const low = tasks.filter((t) => t.priority === "low").length
  const medium = tasks.filter((t) => t.priority === "medium").length
  const high = tasks.filter((t) => t.priority === "high").length
  
  const barData = [
    { name: "Low", tasks: low },
    { name: "Medium", tasks: medium },
    { name: "High", tasks: high },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card className="wm-card">
        <CardHeader>
          <CardTitle>Task Lifecycle</CardTitle>
          <CardDescription>Overview of actionable items extracted from transcripts.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "white" }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="wm-card">
        <CardHeader>
          <CardTitle>Task Priority Pipeline</CardTitle>
          <CardDescription>Analyzing the productivity urgency breakdown.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.2 }}
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "white" }} 
              />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
