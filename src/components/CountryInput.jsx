import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import countries from '../data/countries.json'
import { useKeepAboveKeyboard, visibleArea } from '../lib/keyboard.js'

const MAX_SUGGESTIONS = 8
const ROW_HEIGHT = 44
const LIST_PADDING = 8
const LIST_GAP = 4

// Opens the list below the input when it fits above the keyboard, otherwise above the input,
// and caps its height to the visible space so no suggestion is hidden behind the keyboard.
function placeList(input, list, count) {
  const { top, bottom } = visibleArea()
  const r = input.getBoundingClientRect()
  const spaceBelow = bottom - r.bottom - LIST_GAP - LIST_PADDING
  const spaceAbove = r.top - top - LIST_GAP - LIST_PADDING
  const needed = count * ROW_HEIGHT + LIST_PADDING
  const side = spaceBelow >= needed || spaceBelow >= spaceAbove ? 'below' : 'above'
  const room = side === 'below' ? spaceBelow : spaceAbove
  list.dataset.side = side
  list.style.maxHeight = `${Math.max(ROW_HEIGHT * 2 + LIST_PADDING, Math.min(room, needed))}px`
}

const fold = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()

const searchable = countries.map((c) => ({
  country: c,
  keys: [c.name, ...(c.aliases ?? [])].map(fold),
}))

function suggest(query, excluded) {
  const q = fold(query)
  if (!q) return []
  const prefix = []
  const contains = []
  for (const { country, keys } of searchable) {
    if (excluded.has(country.code)) continue
    if (keys.some((k) => k.startsWith(q) || k.split(' ').some((w) => w.startsWith(q)))) prefix.push(country)
    else if (keys.some((k) => k.includes(q))) contains.push(country)
  }
  return [...prefix, ...contains].slice(0, MAX_SUGGESTIONS)
}

function exactMatch(query, excluded) {
  const q = fold(query)
  const hit = searchable.find(({ keys }) => keys.includes(q))
  return hit && !excluded.has(hit.country.code) ? hit.country : null
}

export default function CountryInput({ onSubmit, excludedCodes, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const inputRef = useRef(null)
  // Each guess adds a row above the input, pushing it down towards the keyboard.
  useKeepAboveKeyboard(inputRef, excludedCodes.length)
  const excluded = useMemo(() => new Set(excludedCodes), [excludedCodes])
  const suggestions = useMemo(() => suggest(query, excluded), [query, excluded])

  const selected = exactMatch(query, excluded)

  function choose(country) {
    setQuery(country.name)
    setOpen(false)
  }

  function submit(e) {
    e.preventDefault()
    if (!selected) return
    onSubmit(selected.code)
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && open && !selected) {
      e.preventDefault()
      choose(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && suggestions.length > 0 && !selected
  const listRef = useRef(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!showList || !list) return
    const place = () => placeList(inputRef.current, list, suggestions.length)
    place()
    const vv = window.visualViewport
    vv?.addEventListener('resize', place)
    vv?.addEventListener('scroll', place)
    window.addEventListener('scroll', place, { passive: true })
    return () => {
      vv?.removeEventListener('resize', place)
      vv?.removeEventListener('scroll', place)
      window.removeEventListener('scroll', place)
    }
  }, [showList, suggestions.length])

  return (
    <form className="country-form" onSubmit={submit}>
      <div className="combobox">
        <label htmlFor={`${listId}-input`} className="visually-hidden">
          Country
        </label>
        <input
          id={`${listId}-input`}
          ref={inputRef}
          className="text-input"
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          // Autocorrect would "fix" partial names like "Brun" while the player is still typing.
          inputMode="text"
          enterKeyHint="go"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          placeholder="Start typing a country…"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {showList && (
          <ul className="suggestions" id={listId} role="listbox" ref={listRef}>
            {suggestions.map((c, i) => (
              <li
                key={c.code}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`suggestion ${i === active ? 'suggestion-active' : ''}`}
                // Cancelling mousedown keeps focus (and the on-screen keyboard) in the input.
                // The pick happens on click, which a drag to scroll the list never fires.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(c)}
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="button" disabled={disabled || !selected}>
        Guess
      </button>
    </form>
  )
}
