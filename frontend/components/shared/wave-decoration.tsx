/** Bottom wave band used inside `.app-shell-wave` (see globals.css). */
export function WaveDecoration() {
  const wavePath =
    "M0,88 C320,28 640,118 960,58 C1280,6 1600,96 1920,48 C2144,12 2288,72 2400,56 L2400,120 L0,120 Z"

  return (
    <div className="wave-svg" aria-hidden>
      <svg viewBox="0 0 2400 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d={wavePath} />
      </svg>
    </div>
  )
}
