import { GAME_NAME, SITE_URL } from '../config.js'
import { BAND_EMOJI, closenessBand } from './heat.js'
import { RATING_EMOJI, ratingFor } from './scoring.js'

function hintsLabel(n) {
  if (n === 0) return 'no hints'
  return n === 1 ? '1 hint' : `${n} hints`
}

// Spoiler-free summary: colour per meaning guess, closeness square per origin guess.
export function buildShareText(game) {
  const meaning = game.meaning.guesses.map((g) => RATING_EMOJI[ratingFor(g.similarity)]).join('')
  const origin = game.origin.guesses.map((g) => (g.correct ? '✅' : BAND_EMOJI[closenessBand(g.km)])).join('')
  const originEnd = game.origin.solved ? '' : '❌'

  return [
    `${GAME_NAME} #${game.puzzleNumber}`,
    `🧠 ${meaning} (${hintsLabel(game.meaning.hintsUsed)})`,
    `🌍 ${origin}${originEnd}`,
    SITE_URL,
  ].join('\n')
}
