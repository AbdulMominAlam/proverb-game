export default function ModelLoading({ status, progress, error }) {
  if (status === 'error') {
    return (
      <div className="model-loading model-loading-error" role="alert">
        <p>Couldn't load the meaning checker. Check your connection and reload the page.</p>
        {error && <p className="small muted">{error}</p>}
      </div>
    )
  }
  if (status !== 'loading') return null

  return (
    <div className="model-loading" role="status" aria-live="polite">
      <p>
        Warming up the meaning checker…
        <span className="small muted"> (a one-time ~23 MB download)</span>
      </p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.round(progress)}%` }} />
      </div>
    </div>
  )
}
