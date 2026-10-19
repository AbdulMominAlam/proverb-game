import countries from '../data/countries.json'

export const countriesByCode = new Map(countries.map((c) => [c.code, c]))

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
