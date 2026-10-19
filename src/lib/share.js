import { GAME_NAME } from '../config.js'
import { arrowFor, evaluateOriginGuess } from './geo.js'
import { TIER_EMOJI, tierFor } from './scoring.js'

function hintsLabel(n) {
  if (n === 0) return 'no hints'
  return n === 1 ? '1 hint' : `${n} hints`
}

// Spoiler-free summary: colour per meaning guess, arrow per origin guess.
export function buildShareText(game, proverb) {
  const meaning = game.meaning.guesses.map((g) => TIER_EMOJI[tierFor(g.similarity)]).join('')
  const origin = game.origin.guesses
    .map((g) => {
      const r = evaluateOriginGuess(g.code, proverb.acceptedCountries)
      return r.correct ? '✅' : arrowFor(r.bearing)
    })
    .join('')
  const originEnd = game.origin.solved ? '' : '❌'

  return [
    `${GAME_NAME} #${game.puzzleNumber}`,
    `🧠 ${meaning} (${hintsLabel(game.meaning.hintsUsed)})`,
    `🌍 ${origin}${originEnd}`,
  ].join('\n')
}
