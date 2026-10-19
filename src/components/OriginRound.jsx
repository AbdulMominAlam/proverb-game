import { MAX_ORIGIN_ATTEMPTS } from '../config.js'
import { countriesByCode, directionBetween, formatCountryList, formatKm } from '../lib/geo.js'
import { BAND_LABELS, CORRECT_COLOR, closenessBand, heatColor } from '../lib/heat.js'
import { distanceToAnswer, nearestAnswer } from '../lib/originMap.js'
import CountryInput from './CountryInput.jsx'
import OriginMap from './OriginMap.jsx'

export default function OriginRound({ proverb, origin, dispatch, onContinue }) {
  const accepted = proverb.acceptedCountries
  const attempt = origin.guesses.length + 1

  function handleGuess(code) {
    const correct = accepted.includes(code)
    dispatch({ type: 'originGuess', code, correct, km: correct ? 0 : distanceToAnswer(code, accepted) })
  }

  return (
    <section className="round" aria-labelledby="origin-heading">
      <div className="round-header">
        <h2 id="origin-heading" className="round-title">Where is it from?</h2>
        {!origin.done && (
          <span className="muted small">
            Guess {attempt} of {MAX_ORIGIN_ATTEMPTS}
          </span>
        )}
      </div>

      <div className="origin-layout">
        <OriginMap guesses={origin.guesses} revealCodes={origin.done ? accepted : []} />

        <div className="origin-side">
          {origin.guesses.length > 0 && (
            <ul className="guess-list">
              {origin.guesses.map((g) => (
                <li key={g.code} className={`guess origin-guess ${g.correct ? 'origin-correct' : ''}`}>
                  <span
                    className="chip"
                    style={{ background: g.correct ? CORRECT_COLOR : heatColor(g.km) }}
                    aria-hidden="true"
                  />
                  <span className="origin-name">{countriesByCode.get(g.code).name}</span>
                  <span className="origin-result small">
                    {g.correct ? 'Correct' : <GuessDistance guess={g} accepted={accepted} />}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!origin.done && (
            <CountryInput onSubmit={handleGuess} excludedCodes={origin.guesses.map((g) => g.code)} />
          )}

          {origin.done && (
            <>
              <div className={`reveal ${origin.solved ? 'reveal-good' : 'reveal-bad'}`}>
                <p className="reveal-status">{origin.solved ? 'Well found!' : 'Out of guesses.'}</p>
                <p className="reveal-meaning">
                  {accepted.length > 1 ? 'Accepted answers: ' : 'It’s from '}
                  {formatCountryList(proverb, 6)}.
                </p>
              </div>
              {onContinue && (
                <button type="button" className="button button-wide" onClick={onContinue}>
                  See results
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

// "2,840 km ↗️": distance to the nearest accepted country, and the direction to head in.
function GuessDistance({ guess, accepted }) {
  const direction = directionBetween(guess.code, nearestAnswer(guess.code, accepted).code)
  return (
    <>
      <span className="visually-hidden">
        {BAND_LABELS[closenessBand(guess.km)]}, {formatKm(guess.km)}, head {direction.name}
      </span>
      <span className="muted" aria-hidden="true">
        {formatKm(guess.km)}
      </span>
      <span className="origin-arrow" aria-hidden="true">
        {direction.arrow}
      </span>
    </>
  )
}
