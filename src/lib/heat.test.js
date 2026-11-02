import { describe, expect, it } from 'vitest'
import { BAND_EMOJI, BAND_LABELS, closenessBand, heatColor } from './heat.js'

describe('heatColor', () => {
  it('uses the hottest colour at or below 0 km', () => {
    expect(heatColor(0)).toBe('var(--heat-1)')
    expect(heatColor(-10)).toBe('var(--heat-1)')
  })

  it('uses the palest colour beyond the last stop', () => {
    expect(heatColor(8001)).toBe('var(--heat-4)')
    expect(heatColor(20000)).toBe('var(--heat-4)')
  })

  it('mixes between neighbouring stops', () => {
    expect(heatColor(750)).toBe('color-mix(in oklch, var(--heat-2) 50%, var(--heat-1))')
    expect(heatColor(2750)).toBe('color-mix(in oklch, var(--heat-3) 50%, var(--heat-2))')
    expect(heatColor(6000)).toBe('color-mix(in oklch, var(--heat-4) 50%, var(--heat-3))')
  })

  it('lands fully on a stop at its distance', () => {
    expect(heatColor(1500)).toBe('color-mix(in oklch, var(--heat-2) 100%, var(--heat-1))')
    expect(heatColor(8000)).toBe('color-mix(in oklch, var(--heat-4) 100%, var(--heat-3))')
  })

  it('rounds the mix percentage to a whole number', () => {
    expect(heatColor(1)).toBe('color-mix(in oklch, var(--heat-2) 0%, var(--heat-1))')
    expect(heatColor(10)).toBe('color-mix(in oklch, var(--heat-2) 1%, var(--heat-1))')
  })
})

describe('closenessBand', () => {
  it.each([
    [0, 'veryClose'],
    [500, 'veryClose'],
    [501, 'close'],
    [2000, 'close'],
    [2001, 'medium'],
    [5000, 'medium'],
    [5001, 'far'],
    [20000, 'far'],
  ])('puts %d km in %s', (km, band) => {
    expect(closenessBand(km)).toBe(band)
  })

  it('has a label and emoji for every band', () => {
    for (const band of ['veryClose', 'close', 'medium', 'far']) {
      expect(BAND_LABELS[band]).toBeTypeOf('string')
      expect(BAND_EMOJI[band]).toBeTypeOf('string')
    }
  })
})
