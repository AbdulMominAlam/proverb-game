// Generates the link-preview image and icons in public/ from the names in src/config.js.
// Re-run after changing GAME_NAME, SITE_URL or SITE_TAGLINE:  npm run share-images
//
// Uses the Iowan Old Style and Helvetica Neue system fonts (macOS); elsewhere resvg falls back
// to Georgia / Arial, so check the output if you run it on another OS.
import { writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { GAME_NAME, SITE_TAGLINE, SITE_URL } from '../src/config.js'

const PUBLIC = new URL('../public/', import.meta.url)

// A proverb that isn't in the daily rotation, so the preview never spoils a puzzle.
const EXAMPLE_LITERAL = 'Not my circus, not my monkeys.'

const COLORS = {
  bg: '#f6f2ea',
  surface: '#fffdf8',
  border: '#ddd5c6',
  text: '#22201c',
  muted: '#6f685d',
  accent: '#2f5d50',
  cream: '#f4efe6',
}
const SERIF = "'Iowan Old Style', Georgia, serif"
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Two opening quote marks, drawn as shapes so the icon needs no font. Drawn on a 64x64 grid.
const QUOTE_MARKS = `
  <g fill="${COLORS.cream}" stroke="${COLORS.cream}" stroke-linecap="round">
    <circle cx="23" cy="38" r="7.5" stroke="none" />
    <path d="M16.5 37 C16 28 19.5 22 27 18.5" fill="none" stroke-width="5" />
    <circle cx="42" cy="38" r="7.5" stroke="none" />
    <path d="M35.5 37 C35 28 38.5 22 46 18.5" fill="none" stroke-width="5" />
  </g>`

// rounded: true for the favicon; iOS rounds the apple-touch-icon itself, so that one is square.
const iconSvg = ({ rounded }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${COLORS.accent}" />${QUOTE_MARKS}
</svg>
`

function ogImageSvg() {
  const W = 1200
  const H = 630
  const [taglineA, taglineB] = SITE_TAGLINE.split(/(?<=\.)\s+/)
  const host = new URL(SITE_URL).host
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${COLORS.bg}" />

  <svg x="72" y="64" width="76" height="76" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${COLORS.accent}" />${QUOTE_MARKS}
  </svg>
  <text x="172" y="124" font-family="${SERIF}" font-size="68" font-weight="600" fill="${COLORS.text}">${escapeXml(GAME_NAME)}</text>

  <text font-family="${SANS}" font-size="38" fill="${COLORS.text}">
    <tspan x="72" y="222">${escapeXml(taglineA)}</tspan>
    ${taglineB ? `<tspan x="72" y="272" fill="${COLORS.accent}" font-weight="700">${escapeXml(taglineB)}</tspan>` : ''}
  </text>

  <rect x="72" y="326" width="${W - 144}" height="200" rx="28" fill="${COLORS.surface}" stroke="${COLORS.border}" stroke-width="2" />
  <text x="${W / 2}" y="384" text-anchor="middle" font-family="${SANS}" font-size="20" letter-spacing="4" fill="${COLORS.muted}">LITERALLY TRANSLATED</text>
  <text x="${W / 2}" y="466" text-anchor="middle" font-family="${SERIF}" font-size="58" fill="${COLORS.text}">“${escapeXml(EXAMPLE_LITERAL)}”</text>

  <text x="72" y="584" font-family="${SANS}" font-size="24" fill="${COLORS.muted}">A new proverb every day</text>
  <text x="${W - 72}" y="584" text-anchor="end" font-family="${SANS}" font-size="24" font-weight="700" fill="${COLORS.accent}">${escapeXml(host)}</text>
</svg>
`
}

function renderPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Georgia' },
  })
  return resvg.render().asPng()
}

// A .ico file can hold a PNG directly: 6-byte header, one 16-byte directory entry, then the PNG.
function pngToIco(png, size) {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count
  header.writeUInt8(size, 6) // width
  header.writeUInt8(size, 7) // height
  header.writeUInt8(0, 8) // palette size
  header.writeUInt8(0, 9) // reserved
  header.writeUInt16LE(1, 10) // colour planes
  header.writeUInt16LE(32, 12) // bits per pixel
  header.writeUInt32LE(png.length, 14) // image size
  header.writeUInt32LE(22, 18) // image offset
  return Buffer.concat([header, png])
}

const outputs = {
  'og-image.png': renderPng(ogImageSvg(), 1200),
  'favicon.svg': iconSvg({ rounded: true }),
  'favicon.ico': pngToIco(renderPng(iconSvg({ rounded: true }), 32), 32),
  'apple-touch-icon.png': renderPng(iconSvg({ rounded: false }), 180),
}

for (const [name, data] of Object.entries(outputs)) {
  writeFileSync(new URL(name, PUBLIC), data)
  console.log(`public/${name}  ${(Buffer.byteLength(data) / 1024).toFixed(1)} KB`)
}
