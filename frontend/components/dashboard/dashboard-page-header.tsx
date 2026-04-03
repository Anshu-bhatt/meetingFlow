"use client"

import type { ReactNode } from "react"
import { BackButton } from "@/components/shared/back-button"
import { cn } from "@/lib/utils"

type DashboardPageHeaderProps = {
  backHref: string
  backLabel?: string
  title: string
  description?: string
  badge?: ReactNode
  /** Right side (e.g. action buttons) on large screens */
  end?: ReactNode
  className?: string
}

export function DashboardPageHeader({
  backHref,
  backLabel = "Back",
  title,
  description,
  badge,
  end,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div
        className={cn(
          "flex flex-col gap-4",
          end && "lg:flex-row lg:items-end lg:justify-between",
        )}
      >
        <div className="space-y-2">
          <BackButton fallbackHref={backHref} label={backLabel} className="mb-1" />
          {badge}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
        </div>
        {end ? <div className="flex flex-wrap gap-2">{end}</div> : null}
      </div>
    </div>
  )
}
