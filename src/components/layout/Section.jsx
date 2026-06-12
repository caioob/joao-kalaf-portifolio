import useInView from '../../lib/useInView.js'

/**
 * Vertical rhythm for all page sections (design §4) + the signature
 * scroll-reveal (design §6): a section fades and rises 12px the first time it
 * enters the viewport. The reveal degrades to "always visible" without JS,
 * without IntersectionObserver, or under prefers-reduced-motion (see useInView).
 * Pass reveal={false} to opt out — the Hero is above the fold.
 *
 * Spacing changes stay a single token edit: --spacing-section in theme.css.
 */
export default function Section({ id, className = '', reveal = true, children }) {
  const [ref, inView] = useInView()

  const revealClass = reveal
    ? `transition duration-(--duration-slow) ease-standard ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`
    : ''

  return (
    <section id={id} ref={reveal ? ref : null} className={`py-section ${revealClass} ${className}`}>
      {children}
    </section>
  )
}
