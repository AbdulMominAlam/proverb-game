// Fixes obvious typos in a meaning guess before it's scored, so "stregth" scores like "strength".
// The caller passes Hunspell spellers (nspell; US and British English, so "favours" and
// "favors" are both fine), the embedding model's vocabulary (Map of token -> id, which also
// ranks candidates: lower ids are more common words) and optionally extra words to accept,
// such as the words in today's answers.

// Chat shorthand and slang the dictionaries don't know but players type on purpose.
const KEEP = new Set([
  'lol', 'idk', 'tbh', 'omg', 'imo', 'imho', 'btw', 'smh', 'ngl', 'irl', 'fyi', 'asap', 'aka', 'etc', 'vs',
  'smol', 'cuz', 'sorta', 'dunno',
])

// Standalone Latin-letter words, with internal apostrophes. Words touching digits, accented
// letters or hyphens are left alone.
const WORD = /(?<![\p{L}\p{N}'’-])[A-Za-z]+(?:['’][A-Za-z]+)*(?![\p{L}\p{N}'’-])/gu

// Optimal string alignment distance: edits, inserts, deletes and adjacent swaps each cost 1.
export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

const isCorrect = (word, spellers) => spellers.some((s) => s.correct(word))

function isKnown(word, spellers, vocab, known) {
  const lower = word.toLowerCase()
  if (lower.endsWith("'s") && isKnown(word.slice(0, -2), spellers, vocab, known)) return true // possessives
  return (
    KEEP.has(lower) ||
    known.has(lower) ||
    vocab.has(lower) ||
    isCorrect(word, spellers) ||
    isCorrect(lower, spellers) ||
    isCorrect(lower.toUpperCase(), spellers) // acronyms typed in lowercase, e.g. "covid"
  )
}

// How common a candidate is: its vocabulary id, or for "don't" and "a lot" its rarest part.
// Splitting a word in two is a bigger change, so it counts as 3x rarer: "carefull" becomes
// "careful", not "care full", while "alot" still becomes "a lot".
function rarity(candidate, vocab) {
  const parts = candidate.split(/['\s]/).filter((p) => p.length > 1 || p === 'a' || p === 'i')
  const rarest = Math.max(...parts.map((p) => vocab.get(p) ?? Infinity))
  return candidate.includes(' ') ? rarest * 3 : rarest
}

const swaps = (word) =>
  Array.from({ length: word.length - 1 }, (_, i) => word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2))

// Slips Hunspell's suggestions often miss: two swapped letters ("teh"), a missing apostrophe
// ("dont") and a missing space ("alot"). Split halves must be real words of 3+ letters (or
// "a"/"i"), so "helo" doesn't become "he lo".
function extraCandidates(lower, spellers, vocab) {
  const found = swaps(lower).filter((w) => isCorrect(w, spellers))
  const isWord = (w) => (w.length > 2 || w === 'a' || w === 'i') && vocab.has(w) && isCorrect(w, spellers)
  for (let i = 1; i < lower.length; i++) {
    const [a, b] = [lower.slice(0, i), lower.slice(i)]
    if (isCorrect(`${a}'${b}`, spellers)) found.push(`${a}'${b}`)
    if (isWord(a) && isWord(b)) found.push(`${a} ${b}`)
  }
  return found
}

// True if the fix keeps every letter that was typed, i.e. it swapped or added letters
// ("teh" -> "the", "helo" -> "hello") or dropped an accidental double ("gratefull" -> "grateful").
// Missing or swapped keys are more common slips than stray ones.
function keepsTypedLetters(typed, candidate) {
  const left = [...candidate]
  return [...typed].every((ch, i) => {
    const at = left.indexOf(ch)
    if (at === -1) return ch === typed[i - 1] // the second of a doubled letter
    left.splice(at, 1)
    return true
  })
}

// Closest candidate wins, then one that keeps the typed letters, then the more common word.
function bestCorrection(word, { maxDistance, spellers, vocab }) {
  const lower = word.toLowerCase()
  const suggestions = spellers.flatMap((s) => s.suggest(lower)).filter((s) => s === s.toLowerCase())
  const ranked = [...new Set([...extraCandidates(lower, spellers, vocab), ...suggestions])]
    .map((candidate) => ({
      candidate,
      distance: editDistance(lower, candidate),
      drops: keepsTypedLetters(lower, candidate) ? 0 : 1,
      rarity: rarity(candidate, vocab),
    }))
    .filter((c) => c.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance || a.drops - b.drops || a.rarity - b.rarity)
  return ranked[0]?.candidate ?? null
}

// Returns the guess with obvious misspellings corrected. Correct words, proper nouns, acronyms,
// words the model knows and very short words are kept exactly as typed.
export function correctTypos(text, { spellers, vocab, known = new Set() }) {
  return text.replace(WORD, (typed, offset) => {
    // Phone keyboards type curly apostrophes; the dictionaries only know straight ones.
    const word = typed.replace(/’/g, "'")
    if (word.length < 3 || isKnown(word, spellers, vocab, known)) return typed
    if (/[A-Z]/.test(word.slice(1))) return typed // ACRONYM or CamelCase

    const capitalised = /[A-Z]/.test(word[0])
    const sentenceStart = /(^\s*|[.!?]\s+)$/.test(text.slice(0, offset))
    if (capitalised && !sentenceStart) return typed // probably a name

    // A capital at the start of a sentence could still be a name, so only fix near-certain slips there.
    const maxDistance = capitalised || word.length <= 4 ? 1 : 2
    const fixed = bestCorrection(word, { maxDistance, spellers, vocab })
    if (!fixed) return typed
    return capitalised ? fixed[0].toUpperCase() + fixed.slice(1) : fixed
  })
}
