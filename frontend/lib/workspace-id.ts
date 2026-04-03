const WORKSPACE_ID_KEY = "meetingflow.workspaceId"

const generateWorkspaceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const getOrCreateWorkspaceId = (): string => {
  if (typeof window === "undefined") {
    return "workspace-server"
  }

  const existing = window.localStorage.getItem(WORKSPACE_ID_KEY)
  if (existing?.trim()) {
    return existing
  }

  const nextWorkspaceId = generateWorkspaceId()
  window.localStorage.setItem(WORKSPACE_ID_KEY, nextWorkspaceId)
  return nextWorkspaceId
}

export const clearWorkspaceId = () => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(WORKSPACE_ID_KEY)
}
