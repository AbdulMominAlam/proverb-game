import { countriesByCode } from '../lib/geo.js'
import { CORRECT_COLOR, heatColor } from '../lib/heat.js'
import { MAP_HEIGHT, MAP_WIDTH, bordersPath, countryShape, landPath } from '../lib/originMap.js'

// Flat world map: grey land, guessed countries coloured by closeness, answers in green once revealed.
export default function OriginMap({ guesses, revealCodes }) {
  const latest = guesses.at(-1)?.code
  const guessed = new Set(guesses.map((g) => g.code))
  const layers = [
    ...guesses.map((g) => ({ code: g.code, fill: g.correct ? CORRECT_COLOR : heatColor(g.km) })),
    // Revealed answers the player didn't guess.
    ...revealCodes.filter((code) => !guessed.has(code)).map((code) => ({ code, fill: CORRECT_COLOR })),
  ].map((layer) => ({ ...layer, ...countryShape(layer.code) }))

  const label = guesses.length
    ? `World map showing your guesses: ${guesses.map((g) => countriesByCode.get(g.code).name).join(', ')}`
    : 'World map. Your guesses will be coloured by how close they are.'

  return (
    <div className="origin-map">
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={label}>
        <path d={landPath} className="map-land" />
        <path d={bordersPath} className="map-borders" />
        {layers.map(
          (l) => l.d && <path key={l.code} d={l.d} style={{ fill: l.fill }} className="map-country" />,
        )}
        {layers.map(
          (l) =>
            l.code === latest &&
            l.d && <path key={`${l.code}-outline`} d={l.d} className="map-latest" />,
        )}
        {layers.map(
          (l) =>
            l.dot && (
              <circle
                key={`${l.code}-dot`}
                cx={l.dot.x}
                cy={l.dot.y}
                r={l.dot.r}
                style={{ fill: l.fill }}
                className={`map-dot ${l.code === latest ? 'map-dot-latest' : ''}`}
              />
            ),
        )}
      </svg>
    </div>
  )
}
