import { Suspense, lazy, useEffect, useReducer, useState } from 'react'
import Countdown from './components/Countdown.jsx'
import Header from './components/Header.jsx'
import HowToPlay from './components/HowToPlay.jsx'
import MeaningRound, { MeaningReveal } from './components/MeaningRound.jsx'
import NoPuzzle from './components/NoPuzzle.jsx'
import PreLaunch from './components/PreLaunch.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import StatsPanel, { StatsGrid } from './components/StatsPanel.jsx'
import { getDailyPuzzle, isBeforeLaunch } from './lib/daily.js'
import { gameReducer, isGameOver } from './lib/gameState.js'
import { hasSeenHowToPlay, loadGame, loadStats, markHowToPlaySeen, recordResult, saveGame } from './lib/storage.js'
import { useEmbedder } from './lib/useEmbedder.js'

// The origin round brings the world map with it, so it loads only when needed.
const OriginRound = lazy(() => import('./components/OriginRound.jsx'))

function initialScreen(game) {
  if (isGameOver(game)) return 'results'
  if (game.origin.guesses.length > 0) return 'origin'
  return 'meaning'
}

export default function App() {
  // Checked once on load; the pre-launch countdown offers a reload when the first puzzle is ready.
  const [beforeLaunch] = useState(() => isBeforeLaunch())
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())
  if (beforeLaunch) return <PreLaunch />
  return proverb ? <Game puzzleNumber={puzzleNumber} proverb={proverb} /> : <NoPuzzle puzzleNumber={puzzleNumber} />
}

function Game({ puzzleNumber, proverb }) {
  const [game, dispatch] = useReducer(gameReducer, puzzleNumber, loadGame)
  // 'meaning' -> 'origin' -> 'results'; the player moves on with a button after each round.
  const [screen, setScreen] = useState(() => initialScreen(game))
  const [alreadyPlayed] = useState(() => isGameOver(game))
  // recordResult is idempotent, so this also covers a finished round whose result wasn't recorded yet.
  const [stats, setStats] = useState(() =>
    game.meaning.done ? recordResult(puzzleNumber, game.meaning.solved) : loadStats(),
  )
  const [showStats, setShowStats] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(() => !hasSeenHowToPlay())
  // A guess can match a plain paraphrase or a well-known English idiom with the same meaning.
  const [scoringTargets] = useState(() => [...proverb.meanings, ...proverb.englishEquivalents])
  const embedder = useEmbedder(scoringTargets, { enabled: !game.meaning.done })

  useEffect(() => {
    saveGame(game)
  }, [game])

  // A win only needs the meaning, so the result is recorded as soon as that round ends.
  function act(action) {
    const next = gameReducer(game, action)
    dispatch(action)
    if (next.meaning.done && !game.meaning.done) setStats(recordResult(puzzleNumber, next.meaning.solved))
  }

  return (
    <div className={`app ${screen === 'origin' ? 'app-wide' : ''}`}>
      <Header puzzleNumber={puzzleNumber} onHelp={() => setShowHowToPlay(true)} onStats={() => setShowStats(true)} />
      <main className="main">
        {screen === 'results' && isGameOver(game) ? (
          <ResultsScreen game={game} proverb={proverb} alreadyPlayed={alreadyPlayed}>
            <StatsGrid stats={stats} puzzleNumber={puzzleNumber} />
            <Countdown />
          </ResultsScreen>
        ) : (
          <>
            <ProverbCard literal={proverb.literal} />
            {screen === 'origin' ? (
              <>
                <MeaningReveal proverb={proverb} solved={game.meaning.solved} />
                <Suspense fallback={<p className="muted round">Loading the map…</p>}>
                  <OriginRound
                    proverb={proverb}
                    origin={game.origin}
                    dispatch={act}
                    onContinue={() => setScreen('results')}
                  />
                </Suspense>
              </>
            ) : (
              <MeaningRound
                proverb={proverb}
                meaning={game.meaning}
                embedder={embedder}
                dispatch={act}
                onContinue={() => setScreen('origin')}
              />
            )}
          </>
        )}
      </main>
      {showStats && <StatsPanel stats={stats} puzzleNumber={puzzleNumber} onClose={() => setShowStats(false)} />}
      {showHowToPlay && (
        <HowToPlay
          onClose={() => {
            markHowToPlaySeen()
            setShowHowToPlay(false)
          }}
        />
      )}
    </div>
  )
}
