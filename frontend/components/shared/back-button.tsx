"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <Button variant="outline" size="sm" onClick={handleBack} className={className}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
