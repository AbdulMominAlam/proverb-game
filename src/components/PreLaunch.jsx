import { useState } from 'react'
import { GAME_NAME, SITE_DESCRIPTION } from '../config.js'
import { launchDate, msUntilLaunch } from '../lib/daily.js'
import Countdown from './Countdown.jsx'
import Header from './Header.jsx'
import HowToPlay from './HowToPlay.jsx'

// Shown instead of a puzzle before LAUNCH_DATE, so nobody plays #1 early.
export default function PreLaunch() {
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const date = launchDate().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="app">
      <Header onHelp={() => setShowHowToPlay(true)} />
      <main className="main">
        <section className="proverb-card" aria-labelledby="prelaunch-heading">
          <p className="proverb-label">Coming soon</p>
          <h2 id="prelaunch-heading" className="prelaunch-heading">
            {GAME_NAME} launches on {date}
          </h2>
          <p className="prelaunch-description muted">{SITE_DESCRIPTION}</p>
          <Countdown label="First proverb in" readyText="Play the first proverb" msUntil={msUntilLaunch} />
        </section>
      </main>
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  )
}
