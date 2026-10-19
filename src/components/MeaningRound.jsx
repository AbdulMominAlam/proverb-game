import { useState } from 'react'
import { MAX_MEANING_ATTEMPTS } from '../config.js'
import HintList from './HintList.jsx'
import HotColdBar from './HotColdBar.jsx'
import ModelLoading from './ModelLoading.jsx'

const normalise = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ')

export default function MeaningRound({ proverb, meaning, embedder, dispatch, onContinue }) {
  const [text, setText] = useState('')
  const [scoring, setScoring] = useState(false)
  const [message, setMessage] = useState(null)

  const ready = embedder.status === 'ready'
  const attempt = meaning.guesses.length + 1

  async function handleSubmit(e) {
    e.preventDefault()
    const guess = text.trim()
    if (!guess || !ready || scoring) return
    if (meaning.guesses.some((g) => normalise(g.text) === normalise(guess))) {
      setMessage('You already tried that one.')
      return
    }
    setScoring(true)
    setMessage(null)
    try {
      const similarity = await embedder.score(guess)
      dispatch({ type: 'meaningGuess', text: guess, similarity })
      setText('')
    } catch {
      setMessage('Something went wrong scoring that guess. Please try again.')
    } finally {
      setScoring(false)
    }
  }

  return (
    <section className="round" aria-labelledby="meaning-heading">
      <div className="round-header">
        <h2 id="meaning-heading" className="round-title">What does it mean?</h2>
        {!meaning.done && (
          <span className="muted small">
            Guess {attempt} of {MAX_MEANING_ATTEMPTS}
          </span>
        )}
      </div>

      {meaning.guesses.length > 0 && (
        <ul className="guess-list">
          {meaning.guesses.map((g, i) => (
            <li key={i} className="guess">
              <p className="guess-text">{g.text}</p>
              <HotColdBar similarity={g.similarity} />
            </li>
          ))}
        </ul>
      )}

      {!meaning.done && (
        <>
          <ModelLoading status={embedder.status} progress={embedder.progress} error={embedder.error} />
          <form className="guess-form" onSubmit={handleSubmit}>
            <label htmlFor="meaning-input" className="visually-hidden">
              Your guess at the meaning
            </label>
            <input
              id="meaning-input"
              className="text-input"
              type="text"
              autoComplete="off"
              placeholder={ready ? 'In your own words, it means…' : 'Loading…'}
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
              disabled={!ready || scoring}
            />
            <button type="submit" className="button" disabled={!ready || scoring || !text.trim()}>
              {scoring ? 'Checking…' : 'Guess'}
            </button>
          </form>
          {message && <p className="form-message">{message}</p>}
          <HintList
            hints={proverb.hints}
            hintsUsed={meaning.hintsUsed}
            canReveal
            onReveal={() => dispatch({ type: 'meaningHint', max: proverb.hints.length })}
          />
        </>
      )}

      {meaning.done && (
        <>
          {meaning.hintsUsed > 0 && <HintList hints={proverb.hints} hintsUsed={meaning.hintsUsed} />}
          <MeaningReveal proverb={proverb} solved={meaning.solved} />
          {onContinue && (
            <button type="button" className="button button-wide" onClick={onContinue}>
              Next: where is it from?
            </button>
          )}
        </>
      )}
    </section>
  )
}

export function MeaningReveal({ proverb, solved }) {
  return (
    <div className={`reveal ${solved ? 'reveal-good' : 'reveal-bad'}`}>
      <p className="reveal-status">{solved ? 'You got it!' : 'Out of guesses. Here’s the meaning:'}</p>
      <p className="reveal-meaning">{proverb.meanings[0]}.</p>
      <p className="reveal-equivalent">
        <span className="muted">English equivalent:</span> {proverb.englishEquivalent}
      </p>
    </div>
  )
}
