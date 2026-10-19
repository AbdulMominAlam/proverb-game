import { newGame } from './gameState.js'

const GAME_KEY = 'proverb-game:v1:game'
const STATS_KEY = 'proverb-game:v1:stats'

// localStorage can throw (private mode, blocked storage), so every access is guarded.
function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Progress just won't persist.
  }
}

// Dev-only: ?reset wipes saved progress and stats.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reset')) {
  try {
    localStorage.removeItem(GAME_KEY)
    localStorage.removeItem(STATS_KEY)
  } catch {
    // ignore
  }
}

// Returns today's saved game, or a fresh one if the save is from another day.
export function loadGame(puzzleNumber) {
  const saved = read(GAME_KEY)
  return saved?.puzzleNumber === puzzleNumber ? saved : newGame(puzzleNumber)
}

export function saveGame(game) {
  write(GAME_KEY, game)
}

const EMPTY_STATS = { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, lastPlayed: null, lastWon: null }

export function loadStats() {
  return { ...EMPTY_STATS, ...read(STATS_KEY) }
}

// Records the outcome of a puzzle once; calling again for the same puzzle is a no-op.
export function recordResult(puzzleNumber, won) {
  const stats = loadStats()
  if (stats.lastPlayed != null && puzzleNumber <= stats.lastPlayed) return stats

  const next = { ...stats, played: stats.played + 1, lastPlayed: puzzleNumber }
  if (won) {
    next.wins = stats.wins + 1
    next.currentStreak = stats.lastWon === puzzleNumber - 1 ? stats.currentStreak + 1 : 1
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak)
    next.lastWon = puzzleNumber
  } else {
    next.currentStreak = 0
  }
  write(STATS_KEY, next)
  return next
}

// The stored streak goes stale if a day was skipped; only count it if it's still alive.
export function displayedStreak(stats, puzzleNumber) {
  return stats.lastWon != null && stats.lastWon >= puzzleNumber - 1 ? stats.currentStreak : 0
}
