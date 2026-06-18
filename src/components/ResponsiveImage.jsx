import { srcSetFor, canonicalSrc, SIZES } from '../lib/images.js'

/**
 * Responsive <img> with a WebP `srcset`/`sizes` (docs/08). WebP-only, so no
 * `<picture>` is needed. The caller passes an already-localized `alt` string and
 * the intrinsic `width`/`height` (for CLS). `eager` marks an above-the-fold LCP
 * image (eager load + high fetch priority); everything else lazy-loads.
 */
export default function ResponsiveImage({ src, alt, slot, width, height, eager = false, className }) {
  const srcSet = srcSetFor(src, slot, width)

  return (
    <img
      src={canonicalSrc(src)}
      srcSet={srcSet || undefined}
      sizes={srcSet ? SIZES[slot] : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  )
}
