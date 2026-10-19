import { useReducer, useState } from 'react'
import Header from './components/Header.jsx'
import MeaningRound, { MeaningReveal } from './components/MeaningRound.jsx'
import OriginRound from './components/OriginRound.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import { getDailyPuzzle } from './lib/daily.js'
import { gameReducer, isGameOver, newGame } from './lib/gameState.js'
import { useEmbedder } from './lib/useEmbedder.js'

export default function App() {
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())
  const [game, dispatch] = useReducer(gameReducer, puzzleNumber, newGame)
  // 'meaning' -> 'origin' -> 'results'; the player moves on with a button after each round.
  const [screen, setScreen] = useState('meaning')
  const embedder = useEmbedder(proverb.meanings, { enabled: !game.meaning.done })

  return (
    <div className="app">
      <Header puzzleNumber={puzzleNumber} />
      <main className="main">
        {screen === 'results' && isGameOver(game) ? (
          <ResultsScreen game={game} proverb={proverb} />
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
    </div>
  )
}
