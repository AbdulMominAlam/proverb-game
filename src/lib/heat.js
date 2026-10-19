// Closeness colours and bands for origin guesses. Kept free of map data so the
// results screen and share text can use it without loading the map.

// Colour stops by distance in km; the colours themselves are CSS variables so they follow the theme.
const STOPS = [
  [0, 'var(--heat-1)'],
  [1500, 'var(--heat-2)'],
  [4000, 'var(--heat-3)'],
  [8000, 'var(--heat-4)'],
]

// Smooth colour for a guess `km` from the answer: deep red when touching, pale from ~8,000 km.
export function heatColor(km) {
  if (km <= 0) return STOPS[0][1]
  for (let i = 1; i < STOPS.length; i++) {
    const [toKm, toColor] = STOPS[i]
    const [fromKm, fromColor] = STOPS[i - 1]
    if (km <= toKm) {
      const pct = Math.round(((km - fromKm) / (toKm - fromKm)) * 100)
      return `color-mix(in oklch, ${toColor} ${pct}%, ${fromColor})`
    }
  }
  return STOPS.at(-1)[1]
}

export const CORRECT_COLOR = 'var(--good)'

export function closenessBand(km) {
  if (km <= 500) return 'veryClose'
  if (km <= 2000) return 'close'
  if (km <= 5000) return 'medium'
  return 'far'
}

export const BAND_EMOJI = {
  veryClose: '🟥',
  close: '🟧',
  medium: '🟨',
  far: '⬜',
}

export const BAND_LABELS = {
  veryClose: 'Very close',
  close: 'Close',
  medium: 'Medium',
  far: 'Far',
}
