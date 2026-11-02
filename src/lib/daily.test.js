import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import proverbs from '../data/proverbs.json'
import { LAUNCH_DATE } from '../config.js'

// daily.js reads import.meta.env.DEV at import time, so set it before each fresh import.
async function loadDaily({ dev = false, search = '' } = {}) {
  vi.resetModules()
  vi.stubEnv('DEV', dev)
  vi.stubGlobal('window', { location: { search } })
  return import('./daily.js')
}

const [launchY, launchM, launchD] = LAUNCH_DATE.split('-').map(Number)
// A local date `days` after launch, at the given hour.
const afterLaunch = (days, hour = 12, minute = 0) => new Date(launchY, launchM - 1, launchD + days, hour, minute)

let daily
beforeEach(async () => {
  daily = await loadDaily()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('daysSinceLaunch', () => {
  it('is 0 all through launch day', () => {
    expect(daily.daysSinceLaunch(afterLaunch(0, 0, 0))).toBe(0)
    expect(daily.daysSinceLaunch(afterLaunch(0, 23, 59))).toBe(0)
  })

  it('counts whole local days', () => {
    expect(daily.daysSinceLaunch(afterLaunch(1, 0, 0))).toBe(1)
    expect(daily.daysSinceLaunch(afterLaunch(10))).toBe(10)
    expect(daily.daysSinceLaunch(afterLaunch(-3))).toBe(-3)
  })

  it('is not thrown off by DST changes', () => {
    // US DST starts 8 Mar 2026 and ends 1 Nov 2026 (tests run in America/New_York).
    const before = new Date(2026, 2, 7, 12)
    const after = new Date(2026, 2, 9, 0, 30)
    expect(daily.daysSinceLaunch(after) - daily.daysSinceLaunch(before)).toBe(2)
    const beforeFall = new Date(2026, 9, 31, 23, 30)
    const afterFall = new Date(2026, 10, 2, 0, 30)
    expect(daily.daysSinceLaunch(afterFall) - daily.daysSinceLaunch(beforeFall)).toBe(2)
  })
})

describe('getDailyPuzzle', () => {
  it('serves puzzle #1 on launch day', () => {
    expect(daily.getDailyPuzzle(afterLaunch(0))).toEqual({ puzzleNumber: 1, proverb: proverbs[0] })
  })

  it('serves proverbs[N - 1] for puzzle N', () => {
    expect(daily.getDailyPuzzle(afterLaunch(4))).toEqual({ puzzleNumber: 5, proverb: proverbs[4] })
    const last = proverbs.length
    expect(daily.getDailyPuzzle(afterLaunch(last - 1))).toEqual({ puzzleNumber: last, proverb: proverbs[last - 1] })
  })

  it('clamps to puzzle #1 before launch', () => {
    expect(daily.getDailyPuzzle(afterLaunch(-5)).puzzleNumber).toBe(1)
  })

  it('returns a null proverb once the list runs out', () => {
    const { puzzleNumber, proverb } = daily.getDailyPuzzle(afterLaunch(proverbs.length))
    expect(puzzleNumber).toBe(proverbs.length + 1)
    expect(proverb).toBeNull()
  })

  it('ignores ?day=N outside dev', async () => {
    daily = await loadDaily({ dev: false, search: '?day=7' })
    expect(daily.getDailyPuzzle(afterLaunch(0)).puzzleNumber).toBe(1)
  })

  it('honours ?day=N in dev', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    daily = await loadDaily({ dev: true, search: '?day=7' })
    expect(daily.getDailyPuzzle(afterLaunch(0))).toEqual({ puzzleNumber: 7, proverb: proverbs[6] })
  })

  it.each(['?day=0', '?day=-2', '?day=1.5', '?day=abc'])('ignores invalid dev override %s', async (search) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    daily = await loadDaily({ dev: true, search })
    expect(daily.getDailyPuzzle(afterLaunch(2)).puzzleNumber).toBe(3)
  })
})

describe('isBeforeLaunch', () => {
  it('is true only before launch day', () => {
    expect(daily.isBeforeLaunch(afterLaunch(-1, 23, 59))).toBe(true)
    expect(daily.isBeforeLaunch(afterLaunch(0, 0, 0))).toBe(false)
    expect(daily.isBeforeLaunch(afterLaunch(3))).toBe(false)
  })

  it('is skipped by the dev ?day=N override', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    daily = await loadDaily({ dev: true, search: '?day=1' })
    expect(daily.isBeforeLaunch(afterLaunch(-10))).toBe(false)
  })
})

describe('launch countdown', () => {
  it('launchDate is local midnight on LAUNCH_DATE', () => {
    expect(daily.launchDate()).toEqual(afterLaunch(0, 0, 0))
  })

  it('msUntilLaunch counts down to launch', () => {
    expect(daily.msUntilLaunch(afterLaunch(-1, 23, 0))).toBe(60 * 60 * 1000)
    expect(daily.msUntilLaunch(afterLaunch(0, 0, 0))).toBe(0)
    expect(daily.msUntilLaunch(afterLaunch(0, 1, 0))).toBeLessThan(0)
  })
})

describe('msUntilNextPuzzle', () => {
  it('counts down to the next local midnight', () => {
    expect(daily.msUntilNextPuzzle(afterLaunch(2, 23, 0))).toBe(60 * 60 * 1000)
    expect(daily.msUntilNextPuzzle(afterLaunch(2, 0, 0))).toBe(24 * 60 * 60 * 1000)
  })

  it('handles 23- and 25-hour DST days', () => {
    expect(daily.msUntilNextPuzzle(new Date(2026, 2, 8, 0, 0))).toBe(23 * 60 * 60 * 1000)
    expect(daily.msUntilNextPuzzle(new Date(2026, 10, 1, 0, 0))).toBe(25 * 60 * 60 * 1000)
  })
})

describe('dev warning', () => {
  it('warns when fewer than 7 proverbs remain', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await loadDaily({ dev: true, search: `?day=${proverbs.length - 2}` })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Only 2 proverbs left'))
  })

  it('stays quiet with plenty left', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await loadDaily({ dev: true, search: '?day=1' })
    expect(warn).not.toHaveBeenCalled()
  })
})
