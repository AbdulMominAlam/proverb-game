import { useEffect } from 'react'

// Gap kept between a focused field and the top of the on-screen keyboard.
const MARGIN = 12

// iOS Safari (and every iOS browser, which all use WebKit). iPadOS reports itself as a Mac.
export const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

// The visible part of the page in layout-viewport coordinates. With an on-screen keyboard open,
// the visual viewport is the part of the screen the keyboard doesn't cover.
export function visibleArea() {
  const vv = window.visualViewport
  if (!vv) return { top: 0, bottom: window.innerHeight }
  return { top: vv.offsetTop, bottom: vv.offsetTop + vv.height }
}

// Publishes the keyboard's height as --keyboard-inset on <html>. On iOS the keyboard covers the page
// without shrinking it, so the page pads its bottom by this much to leave room to scroll a field
// above the keyboard. Call once at startup.
//
// Only the keyboard's height counts, not where Safari has panned the visible area (offsetTop):
// otherwise every pan would change the padding, and so the page height, and make Safari pan again.
export function trackKeyboardInset() {
  const vv = window.visualViewport
  if (!vv) return
  let current = -1
  const update = () => {
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height))
    if (inset === current) return
    current = inset
    document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`)
  }
  vv.addEventListener('resize', update)
  update()
}

// Scrolls the page just enough to show `el` above the keyboard.
export function revealAboveKeyboard(el) {
  const { top, bottom } = visibleArea()
  const r = el.getBoundingClientRect()
  if (r.bottom + MARGIN > bottom) window.scrollBy(0, r.bottom + MARGIN - bottom)
  else if (r.top - MARGIN < top) window.scrollBy(0, r.top - MARGIN - top)
}

// While the field in `ref` is focused, keeps it above the keyboard whenever `trigger` changes
// (e.g. a new guess pushes the field down the page). Elsewhere it also corrects the position when
// the keyboard opens or resizes.
//
// On iOS, Safari's own focus scrolling is left alone: the keyboard's height changes while typing
// (the predictive bar comes and goes), and scrolling from code in response makes the page jump.
export function useKeepAboveKeyboard(ref, trigger) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const vv = window.visualViewport
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (document.activeElement === el) revealAboveKeyboard(el)
      })
    }
    if (!IS_IOS) {
      vv?.addEventListener('resize', update)
      el.addEventListener('focus', update)
    }
    update()
    return () => {
      cancelAnimationFrame(frame)
      vv?.removeEventListener('resize', update)
      el.removeEventListener('focus', update)
    }
  }, [ref, trigger])
}
