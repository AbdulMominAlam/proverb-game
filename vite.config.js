import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { GAME_NAME, MAX_MEANING_ATTEMPTS, MAX_ORIGIN_ATTEMPTS, SITE_DESCRIPTION, SITE_URL } from './src/config.js'

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// schema.org data for search engines. `<` is escaped so the JSON can't close its script tag.
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

// Fills the %NAME% placeholders in index.html from src/config.js, so renaming the game is a
// one-line change.
function siteMeta() {
  const values = {
    GAME_NAME,
    PAGE_TITLE: `${GAME_NAME} – A daily proverb puzzle`,
    SITE_URL,
    SITE_DESCRIPTION,
    MAX_MEANING_ATTEMPTS: String(MAX_MEANING_ATTEMPTS),
    MAX_ORIGIN_ATTEMPTS: String(MAX_ORIGIN_ATTEMPTS),
  }
  const structuredData = jsonLd({
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'Game'],
    name: GAME_NAME,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    genre: ['word game', 'puzzle'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    inLanguage: 'en',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  })
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replace('%STRUCTURED_DATA%', structuredData)
          .replace(/%([A-Z_]+)%/g, (match, key) => (key in values ? escapeHtml(values[key]) : match)),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteMeta()],
  // The embedding worker imports @huggingface/transformers, which needs ES module output.
  worker: { format: 'es' },
})
