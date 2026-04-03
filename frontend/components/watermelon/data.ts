export type TaskStatus = "todo" | "doing" | "done"
export type TaskPriority = "low" | "normal" | "high" | "urgent"

export type Task = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  category: string
  date: string
  avatarGradient: string
  subtasks?: string
}

export type Group = {
  id: string
  name: string
  color: string
  count: number
  tasks: Task[]
}

export const amsGroups: Group[] = [
  {
    id: "ams-planning",
    name: "Planning",
    color: "text-blue-500",
    count: 3,
    tasks: [
      {
        id: "ams-1",
        title: "Define sprint goals for onboarding revamp",
        status: "doing",
        priority: "high",
        category: "product",
        date: "Today",
        avatarGradient: "from-blue-500 to-cyan-400",
        subtasks: "3/8",
      },
      {
        id: "ams-2",
        title: "Review API contract for task extraction",
        status: "todo",
        priority: "normal",
        category: "backend",
        date: "Apr 10",
        avatarGradient: "from-violet-500 to-indigo-500",
      },
      {
        id: "ams-3",
        title: "Create QA checklist for release candidate",
        status: "todo",
        priority: "low",
        category: "qa",
        date: "Apr 12",
        avatarGradient: "from-teal-500 to-emerald-400",
      },
    ],
  },
  {
    id: "ams-execution",
    name: "Execution",
    color: "text-emerald-500",
    count: 2,
    tasks: [
      {
        id: "ams-4",
        title: "Implement transcript confidence badge",
        status: "doing",
        priority: "normal",
        category: "frontend",
        date: "Tomorrow",
        avatarGradient: "from-emerald-500 to-lime-400",
        subtasks: "1/3",
      },
      {
        id: "ams-5",
        title: "Sync generated tasks with dashboard metrics",
        status: "done",
        priority: "high",
        category: "analytics",
        date: "Apr 7",
        avatarGradient: "from-amber-500 to-orange-400",
      },
    ],
  },
]

export const visualizeGroups: Group[] = [
  {
    id: "viz-backlog",
    name: "Backlog",
    color: "text-fuchsia-500",
    count: 3,
    tasks: [
      {
        id: "viz-1",
        title: "Prototype timeline view for meeting actions",
        status: "todo",
        priority: "urgent",
        category: "design",
        date: "Apr 9",
        avatarGradient: "from-pink-500 to-rose-400",
      },
      {
        id: "viz-2",
        title: "Add keyboard shortcuts help overlay",
        status: "todo",
        priority: "normal",
        category: "ux",
        date: "Apr 15",
        avatarGradient: "from-sky-500 to-blue-500",
      },
      {
        id: "viz-3",
        title: "Finalize dark theme contrast pass",
        status: "doing",
        priority: "high",
        category: "accessibility",
        date: "Today",
        avatarGradient: "from-slate-600 to-slate-400",
        subtasks: "5/7",
      },
    ],
  },
  {
    id: "viz-completed",
    name: "Completed",
    color: "text-neutral-500",
    count: 2,
    tasks: [
      {
        id: "viz-4",
        title: "Ship reusable status badges",
        status: "done",
        priority: "normal",
        category: "ui",
        date: "Apr 4",
        avatarGradient: "from-indigo-500 to-purple-500",
      },
      {
        id: "viz-5",
        title: "Publish interaction documentation",
        status: "done",
        priority: "low",
        category: "docs",
        date: "Apr 3",
        avatarGradient: "from-cyan-500 to-teal-400",
      },
    ],
  },
]
