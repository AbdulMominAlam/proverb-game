import { describe, expect, it } from 'vitest'
import proverbs from './proverbs.json'
import countries from './countries.json'

const countryCodes = new Set(countries.map((c) => c.code))
const nonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

describe('proverbs.json', () => {
  it('has unique ids', () => {
    const ids = proverbs.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no duplicate originals', () => {
    const originals = proverbs.map((p) => p.original)
    expect(new Set(originals).size).toBe(originals.length)
  })

  describe.each(proverbs.map((p, i) => [i + 1, p.id, p]))('#%i %s', (_n, _id, p) => {
    it('has the required string fields', () => {
      for (const key of ['id', 'original', 'language', 'literal', 'englishEquivalent']) {
        expect(nonEmptyString(p[key]), key).toBe(true)
      }
    })

    it('has known ISO country codes', () => {
      expect(Array.isArray(p.acceptedCountries)).toBe(true)
      expect(p.acceptedCountries.length).toBeGreaterThan(0)
      for (const code of p.acceptedCountries) expect(countryCodes.has(code), code).toBe(true)
      expect(new Set(p.acceptedCountries).size).toBe(p.acceptedCountries.length)
    })

    it('has 5-7 meanings, 3 hints and at least one English equivalent', () => {
      expect(p.meanings.length).toBeGreaterThanOrEqual(5)
      expect(p.meanings.length).toBeLessThanOrEqual(7)
      expect(p.meanings.every(nonEmptyString)).toBe(true)
      expect(p.hints).toHaveLength(3)
      expect(p.hints.every(nonEmptyString)).toBe(true)
      expect(p.englishEquivalents.length).toBeGreaterThan(0)
      expect(p.englishEquivalents.every(nonEmptyString)).toBe(true)
    })

    it('has a valid difficulty and verified flag', () => {
      expect(['easy', 'medium', 'hard']).toContain(p.difficulty)
      expect(typeof p.verified).toBe('boolean')
    })
  })

  it('never repeats a language within any 5 consecutive entries', () => {
    const clashes = []
    for (let i = 0; i + 5 <= proverbs.length; i++) {
      const langs = proverbs.slice(i, i + 5).map((p) => p.language)
      if (new Set(langs).size < 5) clashes.push(`#${i + 1}-#${i + 5}: ${langs.join(', ')}`)
    }
    expect(clashes).toEqual([])
  })
})
