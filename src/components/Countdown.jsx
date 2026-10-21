import { useEffect, useState } from 'react'
import { msUntilNextPuzzle } from '../lib/daily.js'

function format(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export default function Countdown({ label = 'Next proverb in', readyText = 'A new proverb is ready', msUntil = msUntilNextPuzzle }) {
  // Fix the target once so the timer hits zero at midnight instead of rolling over.
  const [target] = useState(() => Date.now() + msUntil())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = target - now

  return (
    <div className="countdown">
      {remaining > 0 ? (
        <>
          <p className="countdown-label">{label}</p>
          <p className="countdown-time">{format(remaining)}</p>
        </>
      ) : (
        <button type="button" className="button" onClick={() => window.location.reload()}>
          {readyText}
        </button>
      )}
    </div>
  )
}
