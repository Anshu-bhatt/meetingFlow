"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type AuthUser = {
  login_id: string
  name: string
  role: string
}

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
          credentials: "include",
        })

        const data = await response.json().catch(() => ({} as { user?: AuthUser | null }))
        setUser(data.user ?? null)
      } catch (error) {
        console.error("[Navbar] Session lookup failed:", error)
        setUser(null)
      }
    }

    loadSession()
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } finally {
      setUser(null)
      router.push("/")
      router.refresh()
    }
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
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
          
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
