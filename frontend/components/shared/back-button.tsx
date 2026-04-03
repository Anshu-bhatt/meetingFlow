"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  className?: string
}

export function BackButton({ fallbackHref = "/", label = "Back", className }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBack}
      className={cn(
        "border-2 transition-all duration-200 hover:border-primary/45 hover:shadow-md",
        className,
      )}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
