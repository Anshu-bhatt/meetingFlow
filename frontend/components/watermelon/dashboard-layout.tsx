"use client"

import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { WaveDecoration } from "@/components/shared/wave-decoration"

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-wave wm-shell flex min-h-screen bg-background">
      <WaveDecoration />
      <DashboardSidebar />
      <main className="relative z-[1] ml-64 flex-1 p-4">{children}</main>
    </div>
  )
}
