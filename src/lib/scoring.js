import { SOLVE_THRESHOLD } from '../config.js'

export function toPercent(similarity) {
  return Math.round(Math.min(1, Math.max(0, similarity)) * 100)
}

export function isSolved(similarity) {
  return similarity >= SOLVE_THRESHOLD
}

// Buckets for labels and share emoji. Boundaries scale with SOLVE_THRESHOLD.
export function tierFor(similarity) {
  if (isSolved(similarity)) return 'solved'
  if (similarity >= SOLVE_THRESHOLD - 0.1) return 'hot'
  if (similarity >= SOLVE_THRESHOLD - 0.25) return 'warm'
  return 'cold'
}

export const TIER_LABELS = {
  cold: 'Cold',
  warm: 'Getting warmer',
  hot: 'Hot!',
  solved: 'Solved',
}

export const TIER_EMOJI = {
  cold: '🟥',
  warm: '🟧',
  hot: '🟨',
  solved: '🟩',
}
