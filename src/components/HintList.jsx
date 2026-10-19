export default function HintList({ hints, hintsUsed, canReveal, onReveal }) {
  return (
    <div className="hints">
      {hintsUsed > 0 && (
        <ol className="hint-list">
          {hints.slice(0, hintsUsed).map((hint, i) => (
            <li key={i}>
              <span className="hint-number">Hint {i + 1}</span> {hint}
            </li>
          ))}
        </ol>
      )}
      {canReveal && hintsUsed < hints.length && (
        <button type="button" className="button button-ghost" onClick={onReveal}>
          Show a hint ({hintsUsed + 1} of {hints.length})
        </button>
      )}
    </div>
  )
}
