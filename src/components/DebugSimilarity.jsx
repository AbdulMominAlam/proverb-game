import { SOLVE_THRESHOLD } from '../config.js'

// Dev-only readout of the raw cosine similarity, for tuning SOLVE_THRESHOLD.
// import.meta.env.DEV is false in production builds, so this renders nothing there.
export default function DebugSimilarity({ similarity }) {
  if (!import.meta.env.DEV) return null
  return (
    <span className="debug-readout" title={`Dev only. Solve threshold ${SOLVE_THRESHOLD}`}>
      sim {similarity.toFixed(3)}
    </span>
  )
}
