"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ContinuousTabs } from "@/components/ui/continuous-tabs"

export function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleSignOut = async () => {
    await logout()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg wm-gradient-text">MeetingFlow AI</span>
          </Link>
          
          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ContinuousTabs
              tabs={[
                { id: "features", label: "Features" },
                { id: "pricing", label: "Pricing" },
                { id: "docs", label: "Docs" }
              ]}
              defaultActiveId="features"
              onChange={(id) => router.push(`/#${id}`)}
            />
          </div>
          
          {/* CTA */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={user.role === "employee" ? "/employee/dashboard" : "/dashboard"}>Dashboard</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
