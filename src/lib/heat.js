// Closeness bands for origin guesses. Kept free of map data so the
// results screen and share text can use it without loading the map.

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
