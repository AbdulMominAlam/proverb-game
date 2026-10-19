import { useEffect, useReducer, useState } from 'react'
import Countdown from './components/Countdown.jsx'
import Header from './components/Header.jsx'
import MeaningRound, { MeaningReveal } from './components/MeaningRound.jsx'
import OriginRound from './components/OriginRound.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import StatsPanel, { StatsGrid } from './components/StatsPanel.jsx'
import { getDailyPuzzle } from './lib/daily.js'
import { gameReducer, isGameOver } from './lib/gameState.js'
import { loadGame, loadStats, recordResult, saveGame } from './lib/storage.js'
import { useEmbedder } from './lib/useEmbedder.js'

function initialScreen(game) {
  if (isGameOver(game)) return 'results'
  if (game.origin.guesses.length > 0) return 'origin'
  return 'meaning'
}

export default function App() {
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())
  const [game, dispatch] = useReducer(gameReducer, puzzleNumber, loadGame)
  // 'meaning' -> 'origin' -> 'results'; the player moves on with a button after each round.
  const [screen, setScreen] = useState(() => initialScreen(game))
  const [alreadyPlayed] = useState(() => isGameOver(game))
  const [stats, setStats] = useState(loadStats)
  const [showStats, setShowStats] = useState(false)
  const embedder = useEmbedder(proverb.meanings, { enabled: !game.meaning.done })

  useEffect(() => {
    saveGame(game)
  }, [game])

  // A win only needs the meaning, so the result is recorded as soon as that round ends.
  const meaningDone = game.meaning.done
  const meaningSolved = game.meaning.solved
  useEffect(() => {
    if (meaningDone) setStats(recordResult(puzzleNumber, meaningSolved))
  }, [meaningDone, meaningSolved, puzzleNumber])

  return (
    <div className="app">
      <Header puzzleNumber={puzzleNumber} onStats={() => setShowStats(true)} />
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
                <OriginRound
                  proverb={proverb}
                  origin={game.origin}
                  dispatch={dispatch}
                  onContinue={() => setScreen('results')}
                />
              </>
            ) : (
              <MeaningRound
                proverb={proverb}
                meaning={game.meaning}
                embedder={embedder}
                dispatch={dispatch}
                onContinue={() => setScreen('origin')}
              />
            )}
          </>
        )}
      </main>
      {showStats && <StatsPanel stats={stats} puzzleNumber={puzzleNumber} onClose={() => setShowStats(false)} />}
    </div>
  )
}
