import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { GAME_NAME, SITE_DESCRIPTION, SITE_URL } from './src/config.js'

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Fills %GAME_NAME%, %SITE_URL% and %SITE_DESCRIPTION% in index.html from src/config.js,
// so renaming the game is a one-line change.
function siteMeta() {
  const values = { GAME_NAME, SITE_URL, SITE_DESCRIPTION }
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/%(GAME_NAME|SITE_URL|SITE_DESCRIPTION)%/g, (_, key) => escapeHtml(values[key])),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteMeta()],
  // The embedding worker imports @huggingface/transformers, which needs ES module output.
  worker: { format: 'es' },
})
