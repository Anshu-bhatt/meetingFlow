import { auth } from '@clerk/nextjs/server'
import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { AuthSplash } from '@/components/auth/auth-splash'

export default async function SignUpPage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthSplash />
        <div className="flex items-center justify-center rounded-3xl border border-border bg-card p-4 shadow-2xl lg:p-8">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                card: 'bg-transparent shadow-none border-0',
              },
            }}
          />
        </div>
      </div>
    </main>
  )
}
