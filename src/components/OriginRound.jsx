import { MAX_ORIGIN_ATTEMPTS } from '../config.js'
import {
  acceptedCountryNames,
  arrowFor,
  countriesByCode,
  directionNameFor,
  evaluateOriginGuess,
  formatKm,
} from '../lib/geo.js'
import CountryInput from './CountryInput.jsx'

export default function OriginRound({ proverb, origin, dispatch, onContinue }) {
  const accepted = proverb.acceptedCountries
  const attempt = origin.guesses.length + 1

  function handleGuess(code) {
    const { correct } = evaluateOriginGuess(code, accepted)
    dispatch({ type: 'originGuess', code, correct })
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

      {origin.guesses.length > 0 && (
        <ul className="guess-list">
          {origin.guesses.map((code) => {
            const result = evaluateOriginGuess(code, accepted)
            return (
              <li key={code} className={`guess origin-guess ${result.correct ? 'origin-correct' : ''}`}>
                <span className="origin-name">{countriesByCode.get(code).name}</span>
                {result.correct ? (
                  <span className="origin-result">✅ Correct</span>
                ) : (
                  <span className="origin-result">
                    {formatKm(result.distanceKm)}
                    <span className="origin-arrow" role="img" aria-label={`to the ${directionNameFor(result.bearing)}`}>
                      {arrowFor(result.bearing)}
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!origin.done && (
        <CountryInput onSubmit={handleGuess} excludedCodes={origin.guesses} />
      )}

      {origin.done && (
        <>
          <div className={`reveal ${origin.solved ? 'reveal-good' : 'reveal-bad'}`}>
            <p className="reveal-status">{origin.solved ? 'Well found!' : 'Out of guesses.'}</p>
            <p className="reveal-meaning">
              {accepted.length > 1 ? 'Accepted answers: ' : 'It’s from '}
              {acceptedCountryNames(proverb).join(', ')}.
            </p>
          </div>
          {onContinue && (
            <button type="button" className="button button-wide" onClick={onContinue}>
              See results
            </button>
          )}
        </>
      )}
    </section>
  )
}
