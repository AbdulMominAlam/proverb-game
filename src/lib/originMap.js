// World map data and border-to-border distances for the origin round.
// Loaded lazily with the origin round, so the meaning round doesn't pay for it.
import { geoDistance, geoEqualEarth, geoPath } from 'd3-geo'
import { feature, mesh, neighbors } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import countries from '../data/countries.json'
import { countriesByCode } from './geo.js'

const EARTH_RADIUS_KM = 6371
const ANTARCTICA = '010'

export const MAP_WIDTH = 1000

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

const projection = geoEqualEarth().fitWidth(MAP_WIDTH, { type: 'FeatureCollection', features })
const path = geoPath(projection)
export const MAP_HEIGHT = Math.ceil(path.bounds({ type: 'FeatureCollection', features })[1][1])

// Static base layer: every country as one land path plus one path of internal borders.
export const landPath = features.map((f) => path(f)).join('')
export const bordersPath = path(mesh(world, topology, (a, b) => a !== b))

// Below this projected area (in viewBox units²) a country is too small to see, so it gets a dot.
const MIN_VISIBLE_AREA = 40
const DOT_RADIUS = 10

export function countryShape(code) {
  const i = indexByCode.get(code)
  const country = countriesByCode.get(code)
  if (i === undefined) {
    const [x, y] = projection([country.lng, country.lat])
    return { d: null, dot: { x, y, r: DOT_RADIUS } }
  }
  const f = features[i]
  const d = path(f)
  if (path.area(f) >= MIN_VISIBLE_AREA) return { d, dot: null }
  const [x, y] = path.centroid(f)
  return { d, dot: { x, y, r: DOT_RADIUS } }
}

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
