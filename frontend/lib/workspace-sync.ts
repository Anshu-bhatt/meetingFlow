/** Fired after dashboard (or other) mutations so Tasks / Meetings views can refetch. */
export const WORKSPACE_DATA_CHANGED_EVENT = "meetflow:workspace-data-changed"

export function emitWorkspaceDataChanged() {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new CustomEvent(WORKSPACE_DATA_CHANGED_EVENT))
}
