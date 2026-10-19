import { RATING_LABELS, THRESHOLD_POSITION, barPosition, ratingFor } from '../lib/scoring.js'
import DebugSimilarity from './DebugSimilarity.jsx'

export default function HotColdBar({ similarity }) {
  const rating = ratingFor(similarity)
  const label = RATING_LABELS[rating]
  const fill = Math.round(barPosition(similarity) * 100)
  const color = `var(--rating-${rating})`

  return (
    <div className="hotcold">
      <div
        className="hotcold-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        aria-valuetext={label}
        aria-label="How close your guess is"
      >
        <div className="hotcold-fill" style={{ width: `${Math.max(fill, 3)}%`, background: color }} />
        <div className="hotcold-target" style={{ left: `${THRESHOLD_POSITION * 100}%` }} />
      </div>
      <div className="hotcold-meta">
        <span className="hotcold-label" style={{ color }}>
          {label}
        </span>
        <DebugSimilarity similarity={similarity} />
      </div>
    </div>
  )
}
