"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getOrCreateWorkspaceId } from "@/lib/workspace-id"

export const useLocalAuth = () => {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(getOrCreateWorkspaceId())
  }, [])

  const getToken = useCallback(async (): Promise<string | null> => null, [])
  const isLoaded = userId !== null

  return useMemo(
    () => ({
      getToken,
      isLoaded,
      userId,
    }),
    [getToken, isLoaded, userId],
  )
}
