// Runs the sentence-embedding model off the main thread.
//
// Messages in:  { type: 'init', model, targets }   { type: 'score', id, text }
// Messages out: { type: 'progress', progress }  { type: 'ready' }
//               { type: 'score', id, similarity }  { type: 'error', id?, message }
import { env, pipeline } from '@huggingface/transformers'
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

async function init(model, targets) {
  extractorPromise ??= pipeline('feature-extraction', model, {
    dtype: 'q8',
    progress_callback: (info) => {
      if (info.status === 'progress_total') {
        self.postMessage({ type: 'progress', progress: info.progress })
      }
    },
  })
  const extractor = await extractorPromise
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
    self.postMessage({ type: 'error', id: data.id, message: String(err?.message ?? err) })
  })
})
