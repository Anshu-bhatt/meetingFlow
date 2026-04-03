import { SignIn } from '@clerk/nextjs'
import { BackButton } from '@/components/shared/back-button'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <BackButton fallbackHref="/" label="Back" className="mb-6" />
        <div className="flex items-center justify-center">
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  )
}
