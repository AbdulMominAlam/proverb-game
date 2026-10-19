import { useReducer, useState } from 'react'
import Header from './components/Header.jsx'
import MeaningRound, { MeaningReveal } from './components/MeaningRound.jsx'
import OriginRound from './components/OriginRound.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import { getDailyPuzzle } from './lib/daily.js'
import { gameReducer, newGame } from './lib/gameState.js'
import { useEmbedder } from './lib/useEmbedder.js'

export default function App() {
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())
  const [game, dispatch] = useReducer(gameReducer, puzzleNumber, newGame)
  const [continued, setContinued] = useState(false)
  const embedder = useEmbedder(proverb.meanings, { enabled: !game.meaning.done })

  const inOrigin = game.meaning.done && (continued || game.origin.guesses.length > 0)

  return (
    <div className="app">
      <Header puzzleNumber={puzzleNumber} />
      <main className="main">
        <ProverbCard literal={proverb.literal} />
        {inOrigin ? (
          <>
            <MeaningReveal proverb={proverb} solved={game.meaning.solved} />
            <OriginRound proverb={proverb} origin={game.origin} dispatch={dispatch} />
          </>
        ) : (
          <MeaningRound
            proverb={proverb}
            meaning={game.meaning}
            embedder={embedder}
            dispatch={dispatch}
            onContinue={() => setContinued(true)}
          />
        )}
      </main>
    </div>
  )
}
