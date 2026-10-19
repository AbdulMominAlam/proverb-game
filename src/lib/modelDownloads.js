// Download and cache helpers for the embedding worker (see embedder.worker.js).
//
// Why this exists: Vercel serves the model compressed (Brotli) without a Content-Length header.
// transformers.js then asks for the file size with a second request (`Range: bytes=0-0`) while the
// real download is still running. Chrome answers that second request with the whole 23 MB file,
// which the library never reads. In incognito (in-memory HTTP cache) the two parallel downloads of
// the same file make the real one fail with "network error". These helpers download each file
// once, completely, and hand the library an in-memory response with the right Content-Length,
// so the size request never happens. They also retry interrupted downloads and report progress.

const RETRY_DELAYS_MS = [500, 1500, 3000] // up to 3 retries after the first attempt

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class DownloadError extends Error {
  constructor(url, reason, { retryable = true } = {}) {
    super(`Download failed: ${url} (${reason})`)
    this.name = 'DownloadError'
    this.url = url
    this.reason = reason
    this.retryable = retryable
  }
}

function describe(err) {
  return err instanceof DownloadError ? err.reason : `${err?.name ?? 'Error'}: ${err?.message ?? err}`
}

// Size of a file from a 1-byte range request, or null if the server doesn't say.
export async function probeSize(url) {
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-0' }, cache: 'no-store' })
    const total = Number(res.headers.get('content-range')?.split('/')[1])
    await res.body?.cancel()
    return res.status === 206 && total > 0 ? total : null
  } catch {
    return null
  }
}

async function downloadOnce(url, total, onProgress) {
  onProgress?.(0)
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new DownloadError(url, `request failed: ${describe(err)}`)
  }
  if (!res.ok) {
    // 5xx and rate limits may be temporary; anything else (e.g. 404) won't fix itself.
    const retryable = res.status >= 500 || res.status === 408 || res.status === 429
    await res.body?.cancel()
    throw new DownloadError(url, `HTTP ${res.status} ${res.statusText}`.trim(), { retryable })
  }

  const expected = total ?? (Number(res.headers.get('content-length')) || null)
  const chunks = []
  let loaded = 0
  try {
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      onProgress?.(loaded)
    }
  } catch (err) {
    throw new DownloadError(url, `interrupted after ${loaded} bytes: ${describe(err)}`)
  }
  if (expected && loaded !== expected) {
    throw new DownloadError(url, `incomplete: got ${loaded} of ${expected} bytes`)
  }

  const body = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.length
  }
  // The body is already decoded, so drop Content-Encoding and give the real length.
  const headers = new Headers(res.headers)
  headers.delete('content-encoding')
  headers.set('content-length', String(loaded))
  return { body, headers, status: res.status, statusText: res.statusText }
}

// Returns a fetch() replacement for transformers.js (env.fetch). Same-origin GETs are downloaded
// completely with retries before the library sees them. After a download finally fails, the
// returned function's `lastError` holds the real cause: the library replaces it with a misleading
// "file was not found locally" error. `sizeOf(url)` may return a known size
// (used to detect truncated downloads); `onProgress(url, loadedBytes)` reports download progress.
export function createModelFetch({ sizeOf, onProgress } = {}) {
  const inFlight = new Map()

  async function download(url) {
    const total = sizeOf?.(url) ?? null
    const report = onProgress ? (loaded) => onProgress(url, loaded) : null
    for (let attempt = 0; ; attempt++) {
      try {
        return await downloadOnce(url, total, report)
      } catch (err) {
        const retryable = !(err instanceof DownloadError) || err.retryable
        const last = attempt >= RETRY_DELAYS_MS.length || !retryable
        console.error(
          `[meaning checker] ${url} failed (attempt ${attempt + 1} of ${RETRY_DELAYS_MS.length + 1}): ${describe(err)}` +
            (last ? '' : ` Retrying in ${RETRY_DELAYS_MS[attempt]} ms.`),
        )
        if (last) {
          modelFetch.lastError = err
          throw err
        }
        await sleep(RETRY_DELAYS_MS[attempt])
      }
    }
  }

  async function modelFetch(input, init = {}) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, self.location.href)
    const method = (init.method ?? 'GET').toUpperCase()
    const isRange = new Headers(init.headers).has('range')
    if (url.origin !== self.location.origin || method !== 'GET' || isRange) return fetch(input, init)

    // Concurrent requests for the same file share one download.
    const key = url.href
    if (!inFlight.has(key)) {
      inFlight.set(key, download(key).finally(() => inFlight.delete(key)))
    }
    const { body, headers, status, statusText } = await inFlight.get(key)
    return new Response(body, { status, statusText, headers })
  }
  modelFetch.lastError = null
  return modelFetch
}

// A Cache API wrapper that never fails the load: if the browser cache can't be opened, read or
// written (private windows, full storage), it logs a warning and carries on without caching.
export function createSafeCache(name) {
  let opened = null
  const open = () => {
    opened ??= caches.open(name).catch((err) => {
      console.warn(`[meaning checker] Browser cache unavailable, continuing without it: ${describe(err)}`)
      return null
    })
    return opened
  }
  return {
    async match(key) {
      try {
        return (await (await open())?.match(key)) ?? undefined
      } catch (err) {
        console.warn(`[meaning checker] Cache read failed for ${key}, downloading instead: ${describe(err)}`)
        return undefined
      }
    },
    async put(key, response) {
      try {
        await (await open())?.put(key, response)
      } catch (err) {
        console.warn(`[meaning checker] Couldn't cache ${key}, continuing without caching: ${describe(err)}`)
      }
    },
  }
}
