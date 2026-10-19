import countries from '../data/countries.json'

export const countriesByCode = new Map(countries.map((c) => [c.code, c]))

const EARTH_RADIUS_KM = 6371
const rad = (deg) => (deg * Math.PI) / 180

export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// Rhumb-line bearing from a to b, in degrees clockwise from north. Unlike the great-circle
// bearing, this matches the direction you'd see on a flat map (US -> India points east, not north).
export function bearing(a, b) {
  const dPsi = Math.log(Math.tan(Math.PI / 4 + rad(b.lat) / 2) / Math.tan(Math.PI / 4 + rad(a.lat) / 2))
  let dLng = rad(b.lng - a.lng)
  if (Math.abs(dLng) > Math.PI) dLng = dLng > 0 ? dLng - 2 * Math.PI : dLng + 2 * Math.PI
  return ((Math.atan2(dLng, dPsi) * 180) / Math.PI + 360) % 360
}

const ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️']
const DIRECTION_NAMES = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']

function octant(deg) {
  return Math.round(deg / 45) % 8
}

export const arrowFor = (deg) => ARROWS[octant(deg)]
export const directionNameFor = (deg) => DIRECTION_NAMES[octant(deg)]

// Evaluates an origin guess against every accepted country, measuring to the nearest one.
export function evaluateOriginGuess(guessCode, acceptedCodes) {
  if (acceptedCodes.includes(guessCode)) return { correct: true, distanceKm: 0, bearing: 0 }
  const guess = countriesByCode.get(guessCode)
  let best = null
  for (const code of acceptedCodes) {
    const target = countriesByCode.get(code)
    const d = distanceKm(guess, target)
    if (!best || d < best.distanceKm) best = { correct: false, distanceKm: d, bearing: bearing(guess, target) }
  }
  return best
}

export function formatKm(km) {
  return `${Math.round(km).toLocaleString()} km`
}

export function acceptedCountryNames(proverb) {
  return proverb.acceptedCountries.map((code) => countriesByCode.get(code).name)
}

// "Turkey", "Pakistan and India", "Mexico, Spain, Colombia and 17 more".
export function formatCountryList(proverb, max = 3) {
  const names = acceptedCountryNames(proverb)
  if (names.length === 1) return names[0]
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  return `${names.slice(0, max).join(', ')} and ${names.length - max} more`
}
