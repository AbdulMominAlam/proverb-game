import { SOLVE_THRESHOLD } from '../config.js'

export function isSolved(similarity) {
  return similarity >= SOLVE_THRESHOLD
}

// Display ratings. Players see these words instead of the raw similarity, which reads like
// a grade and makes correct answers look mediocre. Only isSolved() decides a solve.
const SPOT_ON = 0.85
const VERY_CLOSE = 0.5
const WARM = 0.35

export function ratingFor(similarity) {
  if (isSolved(similarity)) return similarity >= SPOT_ON ? 'spotOn' : 'gotIt'
  if (similarity >= VERY_CLOSE) return 'veryClose'
  if (similarity >= WARM) return 'warm'
  return 'cold'
}

export const RATING_LABELS = {
  spotOn: 'Spot on!',
  gotIt: 'Got it!',
  veryClose: 'Very close',
  warm: 'Warm',
  cold: 'Cold',
}

export const RATING_EMOJI = {
  spotOn: '🟩',
  gotIt: '🟩',
  veryClose: '🟨',
  warm: '🟧',
  cold: '🟥',
}

// Where the hot/cold bar fills to: the solve threshold sits at 75% of the bar and 1.0 is full,
// so a solved answer looks clearly near the top.
export const THRESHOLD_POSITION = 0.75

export function barPosition(similarity) {
  const s = Math.min(1, Math.max(0, similarity))
  if (s <= SOLVE_THRESHOLD) return (s / SOLVE_THRESHOLD) * THRESHOLD_POSITION
  return THRESHOLD_POSITION + ((s - SOLVE_THRESHOLD) / (1 - SOLVE_THRESHOLD)) * (1 - THRESHOLD_POSITION)
}
