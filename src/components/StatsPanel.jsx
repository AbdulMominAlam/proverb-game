import { displayedStreak } from '../lib/storage.js'

export function StatsGrid({ stats, puzzleNumber }) {
  const winPct = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0
  const items = [
    ['Played', stats.played],
    ['Win %', winPct],
    ['Current streak', displayedStreak(stats, puzzleNumber)],
    ['Max streak', stats.maxStreak],
  ]
  return (
    <dl className="stats-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dd>{value}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  )
}

export default function StatsPanel({ stats, puzzleNumber, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-heading"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="dialog-header">
          <h2 id="stats-heading" className="round-title">Statistics</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close" autoFocus>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <StatsGrid stats={stats} puzzleNumber={puzzleNumber} />
        <p className="small muted">A win means solving the meaning. Stats are saved in this browser only.</p>
      </div>
    </div>
  )
}
