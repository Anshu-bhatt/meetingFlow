"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthSplash } from "@/components/auth/auth-splash"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import { Label } from "@/components/ui/label"

type AuthMode = "login" | "signup"

type AuthFormProps = {
  mode: AuthMode
}

const authTitle = {
  login: "Sign in to your workspace",
  signup: "Create a workspace login",
}

const authSubtitle = {
  login: "Use your assigned login ID and password to reach the right dashboard.",
  signup: "Create an employee or manager account and store it in Supabase.",
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [loginId, setLoginId] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"employee" | "manager">("manager")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(
          mode === "signup"
            ? { loginId, name, password, role }
            : { loginId, password }
        ),
      })

      const data = await response.json().catch(() => ({} as { error?: string; redirectTo?: string }))

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      router.replace(data.redirectTo || "/dashboard")
      router.refresh()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthSplash />
        <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl lg:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">MeetingFlow access</p>
            <h1 className="text-3xl font-semibold tracking-tight">{authTitle[mode]}</h1>
            <p className="text-sm text-muted-foreground">{authSubtitle[mode]}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <FloatingInput
                id="loginId"
                name="loginId"
                label="Login ID"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                required
              />
            </div>

            {mode === "signup" ? (
              <div className="space-y-2">
                <FloatingInput
                  id="name"
                  name="name"
                  label="Display name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <FloatingInput
                id="password"
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as "employee" | "manager")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Processing..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            {mode === "login" ? (
              <p>
                Need an account? <Link href="/sign-up" className="text-foreground underline underline-offset-4">Create one</Link>
              </p>
            ) : (
              <p>
                Already have access? <Link href="/sign-in" className="text-foreground underline underline-offset-4">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}