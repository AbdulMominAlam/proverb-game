// Runs the sentence-embedding model off the main thread.
//
// Messages in:  { type: 'init', model, targets }   { type: 'score', id, text }
// Messages out: { type: 'progress', progress }  { type: 'ready' }
//               { type: 'score', id, similarity }  { type: 'error', id?, message }
import { env, pipeline } from '@huggingface/transformers'

env.allowLocalModels = false

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
