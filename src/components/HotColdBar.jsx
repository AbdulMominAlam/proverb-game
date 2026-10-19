import { SOLVE_THRESHOLD } from '../config.js'
import { TIER_LABELS, tierFor, toPercent } from '../lib/scoring.js'

export default function HotColdBar({ similarity }) {
  const pct = toPercent(similarity)
  const tier = tierFor(similarity)
  // 0 at cold, 100 at the solve threshold.
  const heat = Math.round(Math.min(1, Math.max(0, similarity / SOLVE_THRESHOLD)) * 100)
  const color = tier === 'solved' ? 'var(--good)' : `color-mix(in oklab, var(--hot) ${heat}%, var(--cold))`

  return (
    <div className="hotcold">
      <div
        className="hotcold-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% match, ${TIER_LABELS[tier]}`}
      >
        <div className="hotcold-fill" style={{ width: `${Math.max(pct, 3)}%`, background: color }} />
        <div className="hotcold-target" style={{ left: `${toPercent(SOLVE_THRESHOLD)}%` }} />
      </div>
      <div className="hotcold-meta">
        <span className="hotcold-pct" style={{ color }}>{pct}%</span>
        <span className="muted small">{TIER_LABELS[tier]}</span>
      </div>
    </div>
  )
}
