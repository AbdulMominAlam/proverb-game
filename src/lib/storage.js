import { newGame } from './gameState.js'

const GAME_KEY = 'proverb-game:v2:game'
const STATS_KEY = 'proverb-game:v2:stats'
const HOW_TO_PLAY_KEY = 'proverb-game:v2:seen-how-to-play'
const LEGACY_KEYS = ['proverb-game:v1:game', 'proverb-game:v1:stats', 'proverb-game:v1:seen-how-to-play']

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

// v1 saves are pre-launch test games; drop them so launch starts everyone fresh.
try {
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
} catch {
  // ignore
}

// Dev-only: ?reset wipes saved progress and stats.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reset')) {
  try {
    localStorage.removeItem(GAME_KEY)
    localStorage.removeItem(STATS_KEY)
    localStorage.removeItem(HOW_TO_PLAY_KEY)
  } catch {
    // ignore
  }
}

// Returns today's saved game, or a fresh one if the save is from another day.
export function loadGame(puzzleNumber) {
  const saved = read(GAME_KEY)
  if (saved?.puzzleNumber !== puzzleNumber) return newGame(puzzleNumber)
  // Saves from before the heat map stored origin guesses as bare country codes without distances.
  if (saved.origin.guesses.some((g) => typeof g !== 'object')) return { ...saved, origin: newGame(puzzleNumber).origin }
  return saved
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
    next.currentStreak = stats.lastWon >= puzzleNumber - 1 ? stats.currentStreak + 1 : 1
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak)
    next.lastWon = puzzleNumber
  } else {
    next.currentStreak = 0
  }
  write(STATS_KEY, next)
  return next
}

// A day with no proverb shouldn't break a streak, so a live streak is carried over it by moving
// lastWon forward. lastWon then means "the streak is alive through this puzzle", not a win.
export function carryStreakOver(puzzleNumber) {
  const stats = loadStats()
  if (stats.lastWon == null || stats.lastWon !== puzzleNumber - 1) return stats
  const next = { ...stats, lastWon: puzzleNumber }
  write(STATS_KEY, next)
  return next
}

// The stored streak goes stale if a day was skipped; only count it if it's still alive.
export function displayedStreak(stats, puzzleNumber) {
  return stats.lastWon != null && stats.lastWon >= puzzleNumber - 1 ? stats.currentStreak : 0
}

// The how-to-play card shows on the first visit only. If storage is unavailable it just shows again.
export function hasSeenHowToPlay() {
  return read(HOW_TO_PLAY_KEY) === true
}

export function markHowToPlaySeen() {
  write(HOW_TO_PLAY_KEY, true)
}
