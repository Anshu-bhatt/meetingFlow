import Link from 'next/link'
import { AuthSplash } from '@/components/auth/auth-splash'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthSplash />
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-semibold mb-2">Authentication Disabled In Local Mode</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Clerk is not configured for this local environment. You can continue directly to the dashboard.
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
