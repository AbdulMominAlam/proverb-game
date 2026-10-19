import { useReducer, useState } from 'react'
import Header from './components/Header.jsx'
import MeaningRound from './components/MeaningRound.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import { getDailyPuzzle } from './lib/daily.js'
import { gameReducer, newGame } from './lib/gameState.js'
import { useEmbedder } from './lib/useEmbedder.js'

export default function App() {
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())
  const [game, dispatch] = useReducer(gameReducer, puzzleNumber, newGame)
  const embedder = useEmbedder(proverb.meanings, { enabled: !game.meaning.done })

  return (
    <div className="app">
      <Header puzzleNumber={puzzleNumber} />
      <main className="main">
        <ProverbCard literal={proverb.literal} />
        <MeaningRound proverb={proverb} meaning={game.meaning} embedder={embedder} dispatch={dispatch} />
      </main>
    </div>
  )
}
