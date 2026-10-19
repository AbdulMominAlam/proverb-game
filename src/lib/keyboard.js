import { useEffect } from 'react'

// Gap kept between a focused field and the top of the on-screen keyboard.
const MARGIN = 12

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
export function trackKeyboardInset() {
  const vv = window.visualViewport
  if (!vv) return
  const update = () => {
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`)
  }
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  update()
}

// Scrolls the page just enough to show `el` above the keyboard.
export function revealAboveKeyboard(el) {
  const { top, bottom } = visibleArea()
  const r = el.getBoundingClientRect()
  if (r.bottom + MARGIN > bottom) window.scrollBy(0, r.bottom + MARGIN - bottom)
  else if (r.top - MARGIN < top) window.scrollBy(0, r.top - MARGIN - top)
}

// While the field in `ref` is focused, keeps it above the keyboard: when the keyboard opens or
// resizes, and whenever `trigger` changes (e.g. a new guess pushes the field down the page).
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
    vv?.addEventListener('resize', update)
    el.addEventListener('focus', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      vv?.removeEventListener('resize', update)
      el.removeEventListener('focus', update)
    }
  }, [ref, trigger])
}
