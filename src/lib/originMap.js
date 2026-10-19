// World map data and border-to-border distances for the origin round.
// Loaded lazily with the origin round, so the meaning round doesn't pay for it.
import { geoDistance } from 'd3-geo'
import { feature, neighbors } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import countries from '../data/countries.json'
import { countriesByCode } from './geo.js'

const EARTH_RADIUS_KM = 6371
const ANTARCTICA = '010'

const geometries = world.objects.countries.geometries.filter((g) => g.id !== ANTARCTICA)
const topology = { type: 'GeometryCollection', geometries }
const features = feature(world, topology).features
const neighbourIndexes = neighbors(geometries)

const codeByNumeric = new Map(countries.map((c) => [c.numeric, c.code]))
const codeByName = new Map(countries.map((c) => [c.name, c.code]))
// A few features (e.g. Kosovo) have no ISO numeric id, so fall back to the name.
const codeForFeature = (f) => codeByNumeric.get(f.id) ?? codeByName.get(f.properties.name)

const indexByCode = new Map()
features.forEach((f, i) => {
  const code = codeForFeature(f)
  if (code) indexByCode.set(code, i)
})

// Outline points for a country, or its centre point if the 110m map doesn't include it.
const pointCache = new Map()
function pointsFor(code) {
  if (pointCache.has(code)) return pointCache.get(code)
  const i = indexByCode.get(code)
  let points
  if (i === undefined) {
    const c = countriesByCode.get(code)
    points = [[c.lng, c.lat]]
  } else {
    const g = features[i].geometry
    const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    points = polygons.flat(2)
  }
  pointCache.set(code, points)
  return points
}

const distanceCache = new Map()

// Shortest distance between two countries' borders. Countries sharing a border are 0 km apart.
export function borderDistanceKm(a, b) {
  if (a === b) return 0
  const key = a < b ? `${a}|${b}` : `${b}|${a}`
  if (distanceCache.has(key)) return distanceCache.get(key)

  const ia = indexByCode.get(a)
  const ib = indexByCode.get(b)
  let km
  if (ia !== undefined && ib !== undefined && neighbourIndexes[ia].includes(ib)) {
    km = 0
  } else {
    let min = Infinity
    for (const p of pointsFor(a)) {
      for (const q of pointsFor(b)) {
        const d = geoDistance(p, q)
        if (d < min) min = d
      }
    }
    km = min * EARTH_RADIUS_KM
  }
  distanceCache.set(key, km)
  return km
}

// Distance from a guess to the nearest accepted country.
export function distanceToAnswer(guessCode, acceptedCodes) {
  return Math.min(...acceptedCodes.map((code) => borderDistanceKm(guessCode, code)))
}
