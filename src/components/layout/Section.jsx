/**
 * Vertical rhythm for all page sections (design §4).
 * Every section composes <Section><Container>…</Container></Section>;
 * spacing changes are a single token edit: --spacing-section in theme.css.
 * The scroll-reveal animation (design §6) will be added here in the polish pass.
 */
export default function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`py-section ${className}`}>
      {children}
    </section>
  )
}
