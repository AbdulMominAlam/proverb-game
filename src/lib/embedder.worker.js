// Runs the sentence-embedding model off the main thread, fixing obvious typos in each guess first.
//
// Messages in:  { type: 'init', model, targets }   { type: 'score', id, text }
// Messages out: { type: 'progress', progress }  { type: 'ready' }
//               { type: 'score', id, similarity, scored }  { type: 'error', id?, message }
//               (`scored` is the text that was actually scored, after typo fixes)
import { env, pipeline } from '@huggingface/transformers'
import nspell from 'nspell'
import { createModelFetch, createSafeCache, probeSize } from './modelDownloads.js'
import { correctTypos } from './spelling.js'
// The dictionary packages only export a Node loader, so their files are referenced directly.
import gbAff from '../../node_modules/dictionary-en-gb/index.aff?url'
import gbDic from '../../node_modules/dictionary-en-gb/index.dic?url'
import usAff from '../../node_modules/dictionary-en/index.aff?url'
import usDic from '../../node_modules/dictionary-en/index.dic?url'
import asyncifyMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import asyncifyWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import plainMjs from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'
import plainWasm from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'

// Everything is self-hosted, so the game never depends on a third-party CDN at runtime.
// Model files live in public/models/<model id>/ (see public/models/README.md).
env.allowLocalModels = true
env.allowRemoteModels = false
env.localModelPath = `${import.meta.env.BASE_URL}models/`

// transformers.js points the ONNX runtime at jsdelivr by default, picking the plain build on older
// Safari and the asyncify build elsewhere. Keep that choice, but serve the files from our own bundle.
const LOCAL_RUNTIME_FILES = {
  'ort-wasm-simd-threaded.asyncify.mjs': asyncifyMjs,
  'ort-wasm-simd-threaded.asyncify.wasm': asyncifyWasm,
  'ort-wasm-simd-threaded.mjs': plainMjs,
  'ort-wasm-simd-threaded.wasm': plainWasm,
}
const wasm = env.backends.onnx.wasm
if (wasm.wasmPaths && typeof wasm.wasmPaths === 'object') {
  for (const key of ['mjs', 'wasm']) {
    const file = wasm.wasmPaths[key].split('/').at(-1)
    if (!LOCAL_RUNTIME_FILES[file]) throw new Error(`No local copy of ONNX runtime file ${file}`)
    wasm.wasmPaths[key] = new URL(LOCAL_RUNTIME_FILES[file], self.location.href).href
  }
}

// The quantized model file for dtype 'q8' (see init below).
const MODEL_DTYPE = 'q8'
const MODEL_FILE = 'onnx/model_quantized.onnx'

// Cache failures (private windows, full storage) skip caching instead of failing the load.
env.useCustomCache = true
env.customCache = createSafeCache('transformers-cache')

// Progress covers the two large downloads, the model and the ONNX runtime, whose sizes are
// probed before loading starts so the bar can't jump back or fill early.
const sizes = new Map() // url -> bytes
const loadedBytes = new Map() // url -> bytes
function reportProgress(url, loaded) {
  if (!sizes.has(url)) return
  loadedBytes.set(url, loaded)
  const total = [...sizes.values()].reduce((a, b) => a + b, 0)
  const done = [...loadedBytes.values()].reduce((a, b) => a + b, 0)
  self.postMessage({ type: 'progress', progress: Math.min(100, (done / total) * 100) })
}
env.fetch = createModelFetch({ sizeOf: (url) => sizes.get(url), onProgress: reportProgress })

let extractorPromise = null
let targetVectors = null

// Typo fixing: US and British Hunspell dictionaries, the model's vocabulary, and the words in
// today's answers. If the dictionaries fail to load, guesses are scored as typed.
let spellersPromise = null
let vocab = new Map()
let answerWords = new Set()

async function loadSpellers() {
  const text = async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return res.text()
  }
  const load = async (affUrl, dicUrl) => nspell(...(await Promise.all([text(affUrl), text(dicUrl)])))
  return Promise.all([load(usAff, usDic), load(gbAff, gbDic)]).catch((err) => {
    console.warn('[meaning checker] Spellcheck unavailable, scoring guesses as typed:', err)
    return null
  })
}

async function fixTypos(text) {
  const spellers = await spellersPromise
  return spellers ? correctTypos(text, { spellers, vocab, known: answerWords }) : text
}

async function embed(extractor, texts) {
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  return output.tolist()
}

// Vectors are normalised, so the dot product is the cosine similarity.
function dot(a, b) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

// Sizes for the progress bar, for files that will actually be downloaded: anything already in
// the browser cache loads without a network request, so it isn't probed or counted.
async function measureDownloads(model) {
  const modelFileUrl = new URL(`${env.localModelPath}${model}/${MODEL_FILE}`, self.location.href).href
  const urls = [modelFileUrl, wasm.wasmPaths?.wasm].filter(Boolean)
  await Promise.all(
    urls.map(async (url) => {
      if (await env.customCache.match(url)) return
      const size = await probeSize(url)
      if (size) sizes.set(url, size)
    }),
  )
}

async function init(model, targets) {
  spellersPromise ??= loadSpellers()
  answerWords = new Set(targets.join(' ').toLowerCase().replace(/’/g, "'").match(/[a-z]+(?:'[a-z]+)*/g))
  if (!extractorPromise) {
    await measureDownloads(model)
    extractorPromise = pipeline('feature-extraction', model, { dtype: MODEL_DTYPE })
  }
  const extractor = await extractorPromise.catch((err) => {
    extractorPromise = null // let a later init try again
    throw env.fetch.lastError ?? err // the real download failure, not the library's wrapper error
  })
  vocab = extractor.tokenizer.get_vocab()
  targetVectors = await embed(extractor, targets)
  await spellersPromise
  self.postMessage({ type: 'ready' })
}

async function score(id, text) {
  const extractor = await extractorPromise
  const scored = await fixTypos(text)
  const [guess] = await embed(extractor, [scored])
  const similarity = Math.max(...targetVectors.map((t) => dot(guess, t)))
  self.postMessage({ type: 'score', id, similarity, scored })
}

self.addEventListener('message', ({ data }) => {
  const task = data.type === 'init' ? init(data.model, data.targets) : score(data.id, data.text)
  task.catch((err) => {
    // The download helpers already logged each failed attempt with its URL and reason.
    console.error('[meaning checker] Failed:', err)
    self.postMessage({ type: 'error', id: data.id, message: String(err?.message ?? err) })
  })
})
