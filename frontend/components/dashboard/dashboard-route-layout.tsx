"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { WaveDecoration } from "@/components/shared/wave-decoration"

export function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell-wave wm-shell flex min-h-screen bg-background">
      <WaveDecoration />
      <DashboardSidebar />
      <main className="relative z-[1] ml-64 flex min-h-screen w-full min-w-0 flex-1">{children}</main>
    </div>
  )
}
