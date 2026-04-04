import type { Task } from "@/lib/types"
import { getOrCreateWorkspaceId } from "@/lib/workspace-id"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  token?: string | null
  body?: unknown
}

const requestJson = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", token, body } = options
  const headers: Record<string, string> = {}
  const workspaceId = getOrCreateWorkspaceId()

  if (workspaceId) {
    headers["x-workspace-id"] = workspaceId
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    cache: method === "GET" || !method ? "no-store" : undefined,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string; detail?: string }))
    const errorMessage = payload.error || payload.detail || `Request failed (${response.status})`
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

export interface BackendMeeting {
  id: string
  title: string
  transcript: string
  created_at?: string
}

export interface BackendTask {
  id: string
  title: string
  assignee_name?: string | null
  priority?: string | null
  deadline?: string | null
  status?: string | null
  meeting_id?: string
}

const toUiPriority = (priority?: string | null): Task["priority"] => {
  const value = (priority || "").toLowerCase()

  if (value === "high") return "High"
  if (value === "low") return "Low"
  return "Medium"
}

const toBackendPriority = (priority: Task["priority"]): string => priority.toLowerCase()

const toUiCompleted = (status?: string | null): boolean => {
  const value = (status || "").toLowerCase()
  return value === "done" || value === "completed" || value === "complete"
}

export const mapBackendTaskToUiTask = (task: BackendTask): Task => ({
  id: String(task.id),
  title: task.title || "Untitled task",
  assignee: task.assignee_name || "Unassigned",
  priority: toUiPriority(task.priority),
  deadline: task.deadline || null,
  completed: toUiCompleted(task.status),
})

export const fetchMeetings = async (token?: string | null): Promise<BackendMeeting[]> => {
  const response = await requestJson<{ meetings: BackendMeeting[] }>("/api/meetings", { token })
  return Array.isArray(response.meetings) ? response.meetings : []
}

export const fetchTasksForMeeting = async (meetingId: string, token?: string | null): Promise<BackendTask[]> => {
  const response = await requestJson<{ tasks: BackendTask[] }>(`/api/meetings/${meetingId}/tasks`, { token })
  return Array.isArray(response.tasks) ? response.tasks : []
}

export const fetchAllTasks = async (token?: string | null): Promise<Task[]> => {
  try {
    const response = await requestJson<{ tasks: BackendTask[] }>("/api/tasks", { token })
    return (Array.isArray(response.tasks) ? response.tasks : []).map(mapBackendTaskToUiTask)
  } catch (error) {
    // Backward-compatible fallback for environments where /api/tasks isn't available yet.
    console.warn("Falling back to meeting-by-meeting task fetch:", error)
    try {
      const meetings = await fetchMeetings(token)
      const taskLists = await Promise.all(
        meetings.map(async (meeting) => {
          try {
            return await fetchTasksForMeeting(meeting.id, token)
          } catch {
            return []
          }
        }),
      )

      return taskLists.flat().map(mapBackendTaskToUiTask)
    } catch {
      return []
    }
  }
}

export const fetchWorkspaceTasksRaw = async (token?: string | null): Promise<BackendTask[]> => {
  const response = await requestJson<{ tasks: BackendTask[] }>("/api/tasks", { token })
  return Array.isArray(response.tasks) ? response.tasks : []
}

export const saveMeetingWithTasks = async (
  input: { title: string; transcript: string; tasks: Task[] },
  token?: string | null,
): Promise<{ meeting: BackendMeeting; tasks: BackendTask[] }> => {
  const payload = {
    title: input.title,
    transcript: input.transcript,
    tasks: input.tasks.map((task) => ({
      title: task.title,
      assignee: task.assignee || "Unassigned",
      priority: toBackendPriority(task.priority),
      deadline: task.deadline,
    })),
  }

  return requestJson<{ meeting: BackendMeeting; tasks: BackendTask[] }>("/api/meetings/save", {
    method: "POST",
    token,
    body: payload,
  })
}

export const updateTaskById = async (id: string, updates: Partial<Task>, token?: string | null): Promise<void> => {
  const payload: Record<string, unknown> = {}

  if (typeof updates.completed === "boolean") {
    payload.status = updates.completed ? "completed" : "pending"
  }

  if (updates.priority) {
    payload.priority = toBackendPriority(updates.priority)
  }

  if (typeof updates.assignee === "string") {
    payload.assignee_name = updates.assignee
  }

  if (updates.deadline !== undefined) {
    payload.deadline = updates.deadline
  }

  await requestJson<{ task: BackendTask }>(`/api/tasks/${id}`, {
    method: "PUT",
    token,
    body: payload,
  })
}

export const deleteTaskById = async (id: string, token?: string | null): Promise<void> => {
  await requestJson<{ success: boolean }>(`/api/tasks/${id}`, {
    method: "DELETE",
    token,
  })
}
