/**
 * Responsive image ladders (docs/08). WebP-only by decision (2026-06-17):
 * smaller repo footprint and fast builds; `srcset`/`sizes` still deliver the
 * right resolution per viewport, which is the actual "high-res without perf
 * loss" lever. These widths are the SINGLE source of truth — shared by the
 * frontend (srcSetFor) and the build-time generator (scripts/generate-images.mjs),
 * so a card never references a variant the generator didn't write.
 */

/** Widths generated per slot. The master (its intrinsic width) is the top rung. */
export const LADDERS = {
  thumbnail: [400, 800, 1200, 1600, 2400],
  gallery: [640, 1280, 1920, 2560],
  portrait: [320, 480, 640, 960],
}

/** `sizes` per slot — derived from the layout (docs/08 §4). Thumbnail cards are
 * now full-width bands: the container is max-w-site (1200px) with 24px/side
 * padding below the md breakpoint and 48px/side at md+, so the band renders at
 * min(1200px, 100vw) − 96px (≈1104px on desktop). */
export const SIZES = {
  thumbnail: '(min-width: 768px) min(1104px, calc(100vw - 96px)), calc(100vw - 48px)',
  gallery: '(min-width: 768px) min(880px, 90vw), 92vw',
  portrait: '(min-width: 768px) 360px, 80vw',
}

/**
 * Any image src → its canonical WebP path. CMS uploads may be jpg/png; the build
 * generator converts them to WebP, and the frontend always references the WebP
 * form so a not-yet-normalized src still resolves.
 * "…/foo.jpg" → "…/foo.webp"; "…/foo.webp" → "…/foo.webp".
 */
export function canonicalSrc(src) {
  return src.replace(/\.[^./]+$/, '.webp')
}

/** "/images/projects/OVO-thumb.webp" + 800 → "/images/projects/OVO-thumb-800.webp" */
export function variantSrc(src, width) {
  return canonicalSrc(src).replace(/\.webp$/i, `-${width}.webp`)
}

/** Ladder widths strictly below the master's intrinsic width (those need a generated file). */
export function variantWidths(slot, intrinsicWidth) {
  if (!intrinsicWidth) return []
  return (LADDERS[slot] ?? []).filter((w) => w < intrinsicWidth)
}

/**
 * Build a `srcset` for a slot: a generated variant per sub-intrinsic ladder rung,
 * plus the committed master at its own intrinsic width as the top rung. Returns
 * '' when the intrinsic width is unknown (caller then serves the plain master).
 */
export function srcSetFor(src, slot, intrinsicWidth) {
  if (!intrinsicWidth) return ''
  const base = canonicalSrc(src)
  const entries = variantWidths(slot, intrinsicWidth).map((w) => `${variantSrc(src, w)} ${w}w`)
  entries.push(`${base} ${intrinsicWidth}w`)
  return entries.join(', ')
}
