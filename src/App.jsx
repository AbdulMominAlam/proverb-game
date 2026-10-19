import { useState } from 'react'
import Header from './components/Header.jsx'
import ModelLoading from './components/ModelLoading.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import { getDailyPuzzle } from './lib/daily.js'
import { useEmbedder } from './lib/useEmbedder.js'

export default function App() {
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())
  const embedder = useEmbedder(proverb.meanings)

  return (
    <div className="app">
      <Header puzzleNumber={puzzleNumber} />
      <main className="main">
        <ProverbCard literal={proverb.literal} />
        <ModelLoading status={embedder.status} progress={embedder.progress} error={embedder.error} />
      </main>
    </div>
  )
}
