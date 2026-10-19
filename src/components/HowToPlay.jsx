import { MAX_MEANING_ATTEMPTS } from '../config.js'

const icon = { viewBox: '0 0 24 24', width: 22, height: 22, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const STEPS = [
  {
    text: 'Read the literal translation of a proverb from somewhere in the world.',
    icon: (
      <svg {...icon}>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
        <path d="M5 17a3 3 0 0 1 3-3h11" />
      </svg>
    ),
  },
  {
    text: `Guess what it means, in your own words. You get ${MAX_MEANING_ATTEMPTS} tries and 3 hints.`,
    icon: (
      <svg {...icon}>
        <path d="M4 5h16v11H9l-5 4z" />
        <path d="M8 9.5h8M8 12.5h5" />
      </svg>
    ),
  },
  {
    text: 'Guess which country it’s from. The heat map shows how close each guess is.',
    icon: (
      <svg {...icon}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
    ),
  },
]

export default function HowToPlay({ onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog how-to-play"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-heading"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="dialog-header">
          <h2 id="how-to-play-heading" className="round-title">
            How to play
          </h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ol className="how-steps">
          {STEPS.map((step) => (
            <li key={step.text} className="how-step">
              <span className="how-icon">{step.icon}</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
        <p className="small muted how-footnote">A new proverb every day.</p>
        <button type="button" className="button button-wide how-start" onClick={onClose} autoFocus>
          Let’s play
        </button>
      </div>
    </div>
  )
}
