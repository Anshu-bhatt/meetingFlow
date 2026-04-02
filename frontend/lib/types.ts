export interface Task {
  id: string
  title: string
  assignee: string
  priority: "High" | "Medium" | "Low"
  deadline: string | null
  completed: boolean
}

export const teamMembers = [
  "John Doe",
  "Sarah Smith",
  "Mike Johnson",
  "Alex Chen",
  "Emily Brown",
  "Unassigned"
]

export const priorities = ["High", "Medium", "Low"] as const

export type Priority = typeof priorities[number]
