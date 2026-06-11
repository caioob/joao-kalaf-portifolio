/**
 * Horizontal bounds for all page content (design §4).
 * Site width changes are a single token edit: --container-site in theme.css.
 */
export default function Container({ className = '', children }) {
  return <div className={`mx-auto w-full max-w-site px-6 md:px-12 ${className}`}>{children}</div>
}
