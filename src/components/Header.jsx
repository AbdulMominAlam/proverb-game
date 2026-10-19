import { GAME_NAME } from '../config.js'

export default function Header({ puzzleNumber, onStats }) {
  return (
    <header className="header">
      <h1 className="header-title">{GAME_NAME}</h1>
      {puzzleNumber != null && <span className="header-number">#{puzzleNumber}</span>}
      {onStats && (
        <button type="button" className="icon-button" onClick={onStats} aria-label="Statistics">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M5 20V11M12 20V4M19 20v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      )}
    </header>
  )
}
