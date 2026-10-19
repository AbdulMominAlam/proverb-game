import { GAME_NAME } from '../config.js'

export default function Header({ puzzleNumber, onHelp, onStats }) {
  return (
    <header className="header">
      <h1 className="header-title">{GAME_NAME}</h1>
      {puzzleNumber != null && <span className="header-number">#{puzzleNumber}</span>}
      <div className="header-actions">
        {onHelp && (
          <button type="button" className="icon-button" onClick={onHelp} aria-label="How to play">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
              <circle cx="12" cy="17" r="0.4" fill="currentColor" />
            </svg>
          </button>
        )}
        {onStats && (
          <button type="button" className="icon-button" onClick={onStats} aria-label="Statistics">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M5 20V11M12 20V4M19 20v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
