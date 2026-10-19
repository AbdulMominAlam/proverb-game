import { useCallback, useEffect, useRef, useState } from 'react'
import { EMBEDDING_MODEL } from '../config.js'

// Loads the embedding model in a worker and embeds `targets` once; guesses score as the max
// cosine similarity against any target.
// Returns { status: 'loading' | 'ready' | 'error', progress (0-100), error, score(text), retry() }.
// Pass `enabled: false` to skip loading entirely (e.g. when the meaning round is already over).
export function useEmbedder(targets, { enabled = true } = {}) {
  const [state, setState] = useState({ status: 'loading', progress: 0, error: null })
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())
  const nextIdRef = useRef(0)
  // Bumped by retry() to start a fresh worker.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const worker = new Worker(new URL('./embedder.worker.js', import.meta.url), { type: 'module' })
    const pending = pendingRef.current
    workerRef.current = worker

    const fail = (message) => {
      console.error(`[meaning checker] ${message}`)
      setState((s) => ({ ...s, status: 'error', error: message }))
    }
    // The worker script itself failed to load or crashed.
    worker.addEventListener('error', (e) => fail(e.message || 'The meaning checker stopped unexpectedly.'))

    worker.addEventListener('message', ({ data }) => {
      if (data.type === 'progress') {
        setState((s) => ({ ...s, progress: Math.max(s.progress, data.progress) }))
      } else if (data.type === 'ready') {
        setState({ status: 'ready', progress: 100, error: null })
      } else if (data.type === 'score') {
        pending.get(data.id)?.resolve(data.similarity)
        pending.delete(data.id)
      } else if (data.type === 'error') {
        if (data.id != null && pending.has(data.id)) {
          pending.get(data.id).reject(new Error(data.message))
          pending.delete(data.id)
        } else {
          fail(data.message)
        }
      }
    })

    worker.postMessage({ type: 'init', model: EMBEDDING_MODEL, targets })

    return () => {
      worker.terminate()
      workerRef.current = null
      for (const { reject } of pending.values()) reject(new Error('Embedder stopped'))
      pending.clear()
    }
  }, [targets, enabled, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', progress: 0, error: null })
    setAttempt((n) => n + 1)
  }, [])

  const score = useCallback((text) => {
    const worker = workerRef.current
    if (!worker) return Promise.reject(new Error('Embedder not running'))
    const id = nextIdRef.current++
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject })
      worker.postMessage({ type: 'score', id, text })
    })
  }, [])

  return { ...state, score, retry }
}
