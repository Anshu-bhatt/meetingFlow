"use client"

import Link from "next/link"
import { Show } from "@clerk/nextjs"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { WaveDecoration } from "@/components/shared/wave-decoration"
import { Button } from "@/components/ui/button"

export function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <div className="app-shell-wave wm-shell flex min-h-screen bg-background">
          <WaveDecoration />
          <DashboardSidebar />
          <main className="relative z-[1] ml-64 flex min-h-screen w-full min-w-0 flex-1">{children}</main>
        </div>
      </Show>
      <Show when="signed-out">
        <div className="app-shell-wave wm-shell flex min-h-screen items-center justify-center bg-background p-6">
          <WaveDecoration />
          <div className="interactive-surface relative z-[1] rounded-xl border-2 border-border bg-card p-6 text-center shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Sign in required</h2>
            <p className="mb-4 text-sm text-muted-foreground">Please sign in to access this area.</p>
            <Button asChild>
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </Show>
    </>
  )
}
