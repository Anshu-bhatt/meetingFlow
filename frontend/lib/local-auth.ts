"use client"

import { useEffect, useState } from "react"
import { getOrCreateWorkspaceId } from "@/lib/workspace-id"

export const useLocalAuth = () => {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(getOrCreateWorkspaceId())
  }, [])

  return {
    getToken: async (): Promise<string | null> => null,
    isLoaded: userId !== null,
    userId,
  }
}
