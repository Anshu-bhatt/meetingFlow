import { BackButton } from "@/components/shared/back-button"
import { WaveDecoration } from "@/components/shared/wave-decoration"

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-shell-wave wm-shell relative min-h-screen bg-background px-6 py-10">
      <WaveDecoration />
      <div className="relative z-[1] mx-auto max-w-6xl">
        <BackButton fallbackHref="/" label="Back to home" className="mb-6" />
        {children}
      </div>
    </main>
  )
}
