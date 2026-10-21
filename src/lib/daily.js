import proverbs from '../data/proverbs.json'
import { LAUNCH_DATE } from '../config.js'

const DAY_MS = 24 * 60 * 60 * 1000

function localMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Whole local days between the launch date and `now`. Rounding absorbs DST shifts.
export function daysSinceLaunch(now = new Date()) {
  return Math.round((localMidnight(now) - parseLocalDate(LAUNCH_DATE)) / DAY_MS)
}

// Dev-only: ?day=N plays puzzle #N.
function devPuzzleOverride() {
  if (!import.meta.env.DEV) return null
  const n = Number(new URLSearchParams(window.location.search).get('day'))
  return Number.isInteger(n) && n > 0 ? n : null
}

export function getDailyPuzzle(now = new Date()) {
  const puzzleNumber = devPuzzleOverride() ?? Math.max(1, daysSinceLaunch(now) + 1)
  const index = (puzzleNumber - 1) % proverbs.length
  return { puzzleNumber, proverb: proverbs[index] }
}

// Dev-only ?day=N also skips the pre-launch screen.
export function isBeforeLaunch(now = new Date()) {
  return devPuzzleOverride() == null && daysSinceLaunch(now) < 0
}

export function launchDate() {
  return parseLocalDate(LAUNCH_DATE)
}

export function msUntilLaunch(now = new Date()) {
  return launchDate() - now
}

export function msUntilNextPuzzle(now = new Date()) {
  const next = localMidnight(now)
  next.setDate(next.getDate() + 1)
  return next - now
}
