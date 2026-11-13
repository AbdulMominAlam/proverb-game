import { readFileSync } from 'node:fs'
import dictionaryUs from 'dictionary-en'
import dictionaryGb from 'dictionary-en-gb'
import nspell from 'nspell'
import { describe, expect, it } from 'vitest'
import { correctTypos, editDistance } from './spelling.js'

// The same spellers and model vocabulary the embedding worker uses.
const spellers = [nspell(dictionaryUs), nspell(dictionaryGb)]
const tokenizer = JSON.parse(readFileSync('public/models/Xenova/all-MiniLM-L6-v2/tokenizer.json', 'utf8'))
const vocab = new Map(Object.entries(tokenizer.model.vocab))
const fix = (text) => correctTypos(text, { spellers, vocab })

describe('correctTypos', () => {
  it('scores "stregth" the same as "strength": the scorer gets identical text', () => {
    expect(fix('stregth')).toBe(fix('strength'))
    expect(fix('stregth in numbers')).toBe('strength in numbers')
  })

  it('leaves a correct guess unchanged', () => {
    const guess = "Working together makes weak people strong, and you can't beat that."
    expect(fix(guess)).toBe(guess)
  })

  it('fixes common slips', () => {
    expect(fix('you have to beleive in your self')).toBe('you have to believe in your self')
    expect(fix('peple are stronger togther')).toBe('people are stronger together')
    expect(fix('thier patiance pays off')).toBe('their patience pays off')
    expect(fix('teh small things add up')).toBe('the small things add up')
    expect(fix('dont give up')).toBe("don't give up")
    expect(fix('alot of small efforts')).toBe('a lot of small efforts')
    expect(fix('helo and everyting')).toBe('hello and everything')
    expect(fix('be gratefull to your ancestors')).toBe('be grateful to your ancestors')
  })

  it('keeps the capital on a corrected first word', () => {
    expect(fix('Stregth comes from unity')).toBe('Strength comes from unity')
  })

  it('leaves proper nouns, acronyms, numbers and shorthand alone', () => {
    for (const guess of [
      'like the Wordle craze',
      'what NASA does',
      'happens 2x as often',
      'it costs 5kg of rice',
      'lol idk tbh',
      'ok so basically',
      'gonna be fine',
      'like a café',
      'a well-knwn saying',
    ]) {
      expect(fix(guess)).toBe(guess)
    }
  })

  it("accepts words from today's answers", () => {
    expect(correctTypos('a mickle', { spellers, vocab, known: new Set(['mickle']) })).toBe('a mickle')
  })

  it('accepts British and American spellings', () => {
    for (const guess of ['Fortune favours the bold', 'fortune favors the bold', 'no use crying over spilt milk']) {
      expect(fix(guess)).toBe(guess)
    }
  })

  it('keeps curly apostrophes from phone keyboards', () => {
    expect(fix('don’t judge')).toBe('don’t judge')
    expect(fix('walk in someone else’s shoes')).toBe('walk in someone else’s shoes')
  })
})

describe('editDistance', () => {
  it('counts an adjacent swap as one edit', () => {
    expect(editDistance('teh', 'the')).toBe(1)
    expect(editDistance('stregth', 'strength')).toBe(1)
    expect(editDistance('same', 'same')).toBe(0)
  })
})
