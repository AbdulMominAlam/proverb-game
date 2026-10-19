import countries from '../data/countries.json'

export const countriesByCode = new Map(countries.map((c) => [c.code, c]))

const rad = (deg) => (deg * Math.PI) / 180

// Compass direction from a to b, in degrees clockwise from north, as you'd see it on a flat map
// (rhumb line). The great-circle direction would point the US to India over the North Pole.
export function bearing(a, b) {
  const dPsi = Math.log(Math.tan(Math.PI / 4 + rad(b.lat) / 2) / Math.tan(Math.PI / 4 + rad(a.lat) / 2))
  let dLng = rad(b.lng - a.lng)
  if (Math.abs(dLng) > Math.PI) dLng = dLng > 0 ? dLng - 2 * Math.PI : dLng + 2 * Math.PI
  return ((Math.atan2(dLng, dPsi) * 180) / Math.PI + 360) % 360
}

const ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️']
const DIRECTIONS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
const octant = (deg) => Math.round(deg / 45) % 8

// Arrow and spoken direction from one country's centre towards another's.
export function directionBetween(fromCode, toCode) {
  const deg = bearing(countriesByCode.get(fromCode), countriesByCode.get(toCode))
  return { arrow: ARROWS[octant(deg)], name: DIRECTIONS[octant(deg)] }
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
