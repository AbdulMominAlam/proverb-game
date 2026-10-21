// Game-wide settings. Tune these in one place.

export const GAME_NAME = 'Proverbial'

// Public address of the game, used in the share text and link previews (no trailing slash).
export const SITE_URL = 'https://playproverbial.com'

// Used in link previews, the page title and the share image (npm run share-images).
export const SITE_TAGLINE = 'A proverb from somewhere in the world. What does it mean?'
export const SITE_DESCRIPTION =
  'Every day, one proverb from somewhere in the world, translated word for word. Guess what it means, then where it’s from.'

// Puzzle #1 is played on this local date (YYYY-MM-DD).
export const LAUNCH_DATE = '2026-10-19'

// Cosine similarity at or above which a meaning guess counts as solved.
export const SOLVE_THRESHOLD = 0.62

export const MAX_MEANING_ATTEMPTS = 5
export const MAX_ORIGIN_ATTEMPTS = 10

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
