// Only the literal translation is shown during play; the original script would give away the country.
export default function ProverbCard({ literal }) {
  return (
    <section className="proverb-card" aria-label="Today's proverb">
      <p className="proverb-label">Literally translated</p>
      <blockquote className="proverb-literal">“{literal}”</blockquote>
    </section>
  )
}
