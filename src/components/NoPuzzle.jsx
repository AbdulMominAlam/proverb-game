import { useState } from 'react'
import { carryStreakOver, displayedStreak } from '../lib/storage.js'
import Countdown from './Countdown.jsx'
import Header from './Header.jsx'
import HowToPlay from './HowToPlay.jsx'
import StatsPanel, { StatsGrid } from './StatsPanel.jsx'

// Shown when the proverb list has run out, instead of repeating an old puzzle.
export default function NoPuzzle({ puzzleNumber }) {
  const [stats] = useState(() => carryStreakOver(puzzleNumber))
  const [showStats, setShowStats] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  return (
    <div className="app">
      <Header onHelp={() => setShowHowToPlay(true)} onStats={() => setShowStats(true)} />
      <main className="main">
        <section className="proverb-card" aria-labelledby="no-puzzle-heading">
          <h2 id="no-puzzle-heading" className="prelaunch-heading">
            New proverbs are on their way, check back tomorrow!
          </h2>
          {displayedStreak(stats, puzzleNumber) > 0 && (
            <p className="prelaunch-description muted">Your streak is safe: today doesn’t count.</p>
          )}
          <StatsGrid stats={stats} puzzleNumber={puzzleNumber} />
          <Countdown />
        </section>
      </main>
      {showStats && <StatsPanel stats={stats} puzzleNumber={puzzleNumber} onClose={() => setShowStats(false)} />}
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  )
}
