// Runs the sentence-embedding model off the main thread.
//
// Messages in:  { type: 'init', model, targets }   { type: 'score', id, text }
// Messages out: { type: 'progress', progress }  { type: 'ready' }
//               { type: 'score', id, similarity }  { type: 'error', id?, message }
import { env, pipeline } from '@huggingface/transformers'
import { createModelFetch, createSafeCache, probeSize } from './modelDownloads.js'
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
  if (!extractorPromise) {
    await measureDownloads(model)
    extractorPromise = pipeline('feature-extraction', model, { dtype: MODEL_DTYPE })
  }
  const extractor = await extractorPromise.catch((err) => {
    extractorPromise = null // let a later init try again
    throw env.fetch.lastError ?? err // the real download failure, not the library's wrapper error
  })
  targetVectors = await embed(extractor, targets)
  self.postMessage({ type: 'ready' })
}

async function score(id, text) {
  const extractor = await extractorPromise
  const [guess] = await embed(extractor, [text])
  const similarity = Math.max(...targetVectors.map((t) => dot(guess, t)))
  self.postMessage({ type: 'score', id, similarity })
}

self.addEventListener('message', ({ data }) => {
  const task = data.type === 'init' ? init(data.model, data.targets) : score(data.id, data.text)
  task.catch((err) => {
    // The download helpers already logged each failed attempt with its URL and reason.
    console.error('[meaning checker] Failed:', err)
    self.postMessage({ type: 'error', id: data.id, message: String(err?.message ?? err) })
  })
})
