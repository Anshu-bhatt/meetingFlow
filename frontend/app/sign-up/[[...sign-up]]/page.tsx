import { SignUp } from '@clerk/nextjs'
import { AuthSplash } from '@/components/auth/auth-splash'
import { AuthPageShell } from '@/components/auth/auth-page-shell'

export default async function SignUpPage() {
  return (
    <AuthPageShell>
      <div className="grid min-h-[calc(100vh-5rem)] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthSplash />
        <div className="interactive-surface flex items-center justify-center rounded-3xl border-2 border-border bg-card p-4 shadow-2xl lg:p-8">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                card: 'bg-transparent shadow-none border-0',
              },
            }}
          />
        </div>
      </div>
    </AuthPageShell>
  )
}
