import { useState } from 'react'
import Header from './components/Header.jsx'
import ProverbCard from './components/ProverbCard.jsx'
import { getDailyPuzzle } from './lib/daily.js'

export default function App() {
  const [{ puzzleNumber, proverb }] = useState(() => getDailyPuzzle())

  return (
    <div className="app">
      <Header puzzleNumber={puzzleNumber} />
      <main className="main">
        <ProverbCard literal={proverb.literal} />
      </main>
    </div>
  )
}
