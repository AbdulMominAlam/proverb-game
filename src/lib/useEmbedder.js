import { useCallback, useEffect, useRef, useState } from 'react'
import { EMBEDDING_MODEL } from '../config.js'

// Loads the embedding model in a worker and embeds `meanings` once.
// Returns { status: 'loading' | 'ready' | 'error', progress (0-100), error, score(text) }.
// Pass `enabled: false` to skip loading entirely (e.g. when the meaning round is already over).
export function useEmbedder(meanings, { enabled = true } = {}) {
  const [state, setState] = useState({ status: 'loading', progress: 0, error: null })
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())
  const nextIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const worker = new Worker(new URL('./embedder.worker.js', import.meta.url), { type: 'module' })
    const pending = pendingRef.current
    workerRef.current = worker

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
          setState((s) => ({ ...s, status: 'error', error: data.message }))
        }
      }
    })

    worker.postMessage({ type: 'init', model: EMBEDDING_MODEL, meanings })

    return () => {
      worker.terminate()
      workerRef.current = null
      for (const { reject } of pending.values()) reject(new Error('Embedder stopped'))
      pending.clear()
    }
  }, [meanings, enabled])

  const score = useCallback((text) => {
    const worker = workerRef.current
    if (!worker) return Promise.reject(new Error('Embedder not running'))
    const id = nextIdRef.current++
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject })
      worker.postMessage({ type: 'score', id, text })
    })
  }, [])

  return { ...state, score }
}
