import { MAX_MEANING_ATTEMPTS, MAX_ORIGIN_ATTEMPTS } from '../config.js'
import { formatCountryList } from '../lib/geo.js'
import { RATING_LABELS, ratingFor } from '../lib/scoring.js'
import { buildShareText } from '../lib/share.js'
import DebugSimilarity from './DebugSimilarity.jsx'
import ShareButton from './ShareButton.jsx'

export default function ResultsScreen({ game, proverb, alreadyPlayed, children }) {
  const { meaning, origin } = game
  const best = Math.max(...meaning.guesses.map((g) => g.similarity))
  const shareText = buildShareText(game)

  return (
    <section className="results" aria-labelledby="results-heading">
      <h2 id="results-heading" className="results-heading">
        {meaning.solved ? 'Nicely done!' : 'Better luck tomorrow'}
      </h2>
      {alreadyPlayed && (
        <p className="results-note muted small">You've already played today's proverb. Here's how you did.</p>
      )}

      <div className="results-proverb">
        <p className="results-original" dir="auto">{proverb.original}</p>
        <p className="results-language muted small">
          {proverb.language} · {formatCountryList(proverb)}
        </p>
        <p className="results-literal">“{proverb.literal}”</p>
        <p className="results-meaning">{proverb.meanings[0]}.</p>
        <p className="small">
          <span className="muted">English equivalent:</span> {proverb.englishEquivalent}
        </p>
      </div>

      <dl className="results-stats">
        <div>
          <dt>Best guess</dt>
          <dd className="results-rating">
            {RATING_LABELS[ratingFor(best)]}
            <DebugSimilarity similarity={best} />
          </dd>
        </div>
        <div>
          <dt>Meaning</dt>
          <dd>
            {meaning.solved ? `${meaning.guesses.length}/${MAX_MEANING_ATTEMPTS}` : `X/${MAX_MEANING_ATTEMPTS}`}
          </dd>
        </div>
        <div>
          <dt>Hints</dt>
          <dd>{meaning.hintsUsed}</dd>
        </div>
        <div>
          <dt>Origin</dt>
          <dd>{origin.solved ? `${origin.guesses.length}/${MAX_ORIGIN_ATTEMPTS}` : `X/${MAX_ORIGIN_ATTEMPTS}`}</dd>
        </div>
      </dl>

      <pre className="share-preview" aria-label="Share preview">{shareText}</pre>
      <ShareButton text={shareText} />
      {children}
    </section>
  )
}
