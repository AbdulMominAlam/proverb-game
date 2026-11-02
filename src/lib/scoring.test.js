import { describe, expect, it } from 'vitest'
import { SOLVE_THRESHOLD } from '../config.js'
import {
  RATING_EMOJI,
  RATING_LABELS,
  THRESHOLD_POSITION,
  barPosition,
  isSolved,
  ratingFor,
} from './scoring.js'

describe('isSolved', () => {
  it('solves at and above the threshold', () => {
    expect(isSolved(SOLVE_THRESHOLD)).toBe(true)
    expect(isSolved(1)).toBe(true)
  })

  it('does not solve below the threshold', () => {
    expect(isSolved(SOLVE_THRESHOLD - 0.001)).toBe(false)
    expect(isSolved(0)).toBe(false)
    expect(isSolved(-0.2)).toBe(false)
  })
})

describe('ratingFor', () => {
  it.each([
    [1, 'spotOn'],
    [0.85, 'spotOn'],
    [0.84, 'gotIt'],
    [SOLVE_THRESHOLD, 'gotIt'],
    [SOLVE_THRESHOLD - 0.001, 'veryClose'],
    [0.5, 'veryClose'],
    [0.49, 'warm'],
    [0.35, 'warm'],
    [0.34, 'cold'],
    [0, 'cold'],
    [-0.5, 'cold'],
  ])('rates %f as %s', (similarity, rating) => {
    expect(ratingFor(similarity)).toBe(rating)
  })

  it('only gives a solved rating to solved guesses', () => {
    for (let s = -1; s <= 1; s += 0.01) {
      const solvedRating = ['spotOn', 'gotIt'].includes(ratingFor(s))
      expect(solvedRating).toBe(isSolved(s))
    }
  })

  it('has a label and emoji for every rating', () => {
    for (const rating of ['spotOn', 'gotIt', 'veryClose', 'warm', 'cold']) {
      expect(RATING_LABELS[rating]).toBeTypeOf('string')
      expect(RATING_EMOJI[rating]).toBeTypeOf('string')
    }
  })
})

describe('barPosition', () => {
  it('puts the threshold at THRESHOLD_POSITION', () => {
    expect(barPosition(SOLVE_THRESHOLD)).toBeCloseTo(THRESHOLD_POSITION)
  })

  it('spans 0 to 1', () => {
    expect(barPosition(0)).toBe(0)
    expect(barPosition(1)).toBeCloseTo(1)
  })

  it('clamps out-of-range similarities', () => {
    expect(barPosition(-0.3)).toBe(0)
    expect(barPosition(1.5)).toBeCloseTo(1)
  })

  it('scales linearly on each side of the threshold', () => {
    expect(barPosition(SOLVE_THRESHOLD / 2)).toBeCloseTo(THRESHOLD_POSITION / 2)
    expect(barPosition((SOLVE_THRESHOLD + 1) / 2)).toBeCloseTo((THRESHOLD_POSITION + 1) / 2)
  })

  it('never decreases as similarity rises', () => {
    let prev = -Infinity
    for (let s = -0.1; s <= 1.1; s += 0.01) {
      const pos = barPosition(s)
      expect(pos).toBeGreaterThanOrEqual(prev)
      prev = pos
    }
  })
})
