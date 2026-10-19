import { MAX_MEANING_ATTEMPTS, MAX_ORIGIN_ATTEMPTS } from '../config.js'
import { isSolved } from './scoring.js'

export function newGame(puzzleNumber) {
  return {
    puzzleNumber,
    meaning: { guesses: [], hintsUsed: 0, solved: false, done: false },
    origin: { guesses: [], solved: false, done: false },
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'meaningGuess': {
      const m = state.meaning
      if (m.done) return state
      const guesses = [...m.guesses, { text: action.text, similarity: action.similarity }]
      const solved = isSolved(action.similarity)
      const done = solved || guesses.length >= MAX_MEANING_ATTEMPTS
      return { ...state, meaning: { ...m, guesses, solved, done } }
    }
    case 'meaningHint': {
      const m = state.meaning
      if (m.done || m.hintsUsed >= action.max) return state
      return { ...state, meaning: { ...m, hintsUsed: m.hintsUsed + 1 } }
    }
    case 'originGuess': {
      const o = state.origin
      if (o.done || !state.meaning.done) return state
      const guesses = [...o.guesses, action.code]
      const solved = action.correct
      const done = solved || guesses.length >= MAX_ORIGIN_ATTEMPTS
      return { ...state, origin: { guesses, solved, done } }
    }
    default:
      return state
  }
}

export function isGameOver(state) {
  return state.meaning.done && state.origin.done
}
