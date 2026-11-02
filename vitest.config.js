import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
    // Fixed zone with DST so the local-date logic in daily.js is tested the same everywhere.
    env: { TZ: 'America/New_York' },
  },
})
