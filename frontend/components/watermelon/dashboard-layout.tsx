"use client"

import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 ml-64 p-4">
        {children}
      </main>
    </div>
  )
}
