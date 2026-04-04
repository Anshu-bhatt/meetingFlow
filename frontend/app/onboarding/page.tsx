"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useLocalAuth } from "@/lib/local-auth"

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken } = useLocalAuth()
  const [slackUserId, setSlackUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    const localName = typeof window !== "undefined" ? window.localStorage.getItem("meetingflow.userName") : null
    if (localName) {
      setName(localName)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!slackUserId.trim()) {
      toast.error("Slack Member ID is required")
      return
    }

    // Validate Slack ID format (typically starts with U)
    if (!slackUserId.match(/^U[A-Z0-9]{8,}$/i)) {
      toast.error("Invalid Slack Member ID format. Should look like: U0123ABCDE")
      return
    }

    setIsLoading(true)

    try {
      const token = await getToken().catch(() => null)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiUrl}/api/auth/onboard`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          slackUserId: slackUserId.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to complete onboarding")
      }

      toast.success("Onboarding complete!")

      // Update cookie
      document.cookie = `user_onboarded=true; path=/; max-age=86400; SameSite=Lax`

      // Redirect to employee dashboard
      router.push("/employee/dashboard")
    } catch (error) {
      console.error("[Onboarding] Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary-foreground">⚡</span>
            </div>
            <CardTitle className="text-2xl">Welcome to MeetFlow</CardTitle>
            <CardDescription>Complete your profile to get started</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field - read-only for now */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  value={name}
                  disabled
                  className="bg-muted"
                  placeholder="Your name"
                />
                <p className="text-xs text-muted-foreground">Provided by your workspace admin</p>
              </div>

              {/* Slack Member ID field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Slack Member ID</label>
                <Input
                  type="text"
                  placeholder="U0123ABCDE"
                  value={slackUserId}
                  onChange={(e) => setSlackUserId(e.target.value)}
                  disabled={isLoading}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Find it in Slack: Click your avatar → Profile → More (···) → Copy Member ID
                </p>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>

            {/* Helper text */}
            <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Need help?</strong> Your workspace admin added you to MeetFlow.
                We just need your Slack Member ID to connect your account for automatic
                task assignments from meetings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
