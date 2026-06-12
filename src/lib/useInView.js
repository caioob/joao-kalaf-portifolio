import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/**
 * Scroll-reveal hook (design §6) — returns [ref, inView].
 *
 * Progressive enhancement: it starts visible and only opts into the
 * hidden→revealed animation when IntersectionObserver exists AND the user
 * hasn't requested reduced motion. So content never depends on JS or motion —
 * JS-off, no-IO, and reduced-motion environments all render fully visible and
 * never animate. When animating, it fires once and disconnects.
 */
export default function useInView({ once = true } = {}) {
  const animate = typeof IntersectionObserver !== 'undefined' && !prefersReducedMotion()
  const ref = useRef(null)
  const [inView, setInView] = useState(!animate)

  useEffect(() => {
    if (!animate || !ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setInView(true)
      if (once) observer.disconnect()
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [animate, once])

  return [ref, inView]
}
