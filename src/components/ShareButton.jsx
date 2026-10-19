import { useEffect, useState } from 'react'

export default function ShareButton({ text }) {
  const [status, setStatus] = useState('idle') // idle | copied | failed

  useEffect(() => {
    if (status !== 'copied') return
    const t = setTimeout(() => setStatus('idle'), 2000)
    return () => clearTimeout(t)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="share">
      <button type="button" className="button button-wide" onClick={copy}>
        {status === 'copied' ? 'Copied!' : 'Share result'}
      </button>
      {status === 'failed' && (
        <>
          <p className="small muted">Couldn't copy automatically. Select the text below and copy it:</p>
          <textarea className="share-fallback" readOnly value={text} rows={3} onFocus={(e) => e.target.select()} />
        </>
      )}
    </div>
  )
}
