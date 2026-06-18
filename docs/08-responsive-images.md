# 08 — Responsive Images

**Goal:** higher-resolution imagery (crisp on large/retina displays) **without** a performance regression. The lever is responsive delivery — ship many sizes and modern formats, let the browser download only the smallest file that fills the slot at the device's pixel density.

This spec is the source of truth for the image pipeline (`scripts/generate-images.mjs` + the dump's `scripts/lib/behance-images.mjs`), the `Image` schema (doc 04), and the rendering components (`ProjectCard`, `ProjectDetail`, About portrait).

> **Decision (2026-06-17, implemented):** **WebP-only, four widths per slot, variants committed.** AVIF (originally the primary format) was dropped to keep the repo small (~250 variant files vs ~1,000+) and builds fast — re-encoding ~1,000 AVIFs on every Vercel deploy would add minutes. `srcset`/`sizes` over a WebP ladder is the actual lever for "right resolution per viewport". The sections below reflect the implemented design; struck-through ambitions (AVIF, 6-width ladders) may return if build caching makes them cheap.

## 1. Format

WebP only, served via a plain `<img srcset sizes>` (no `<picture>` element needed — every candidate is WebP). WebP support is universal in our 2026 baseline (`docs/01-product-spec.md`). Source masters may be any format; outputs are always WebP at quality 80.

## 2. Width ladders

A "ladder" is the set of widths generated per image; `sizes` (§4) decides which rung the browser downloads. Four widths per slot — the single source of truth is `LADDERS` in `src/lib/images.js`.

| Slot | Aspect | Ladder (px wide) | Master min |
| --- | --- | --- | --- |
| **thumbnail** (grid card) | 16:10 (cropped) | 400, 800, 1200, **1600** | ≥ 1600 |
| **gallery** (detail modal) | native (no crop) | 640, 1280, 1920, **2560** | ≥ 2048 |
| **portrait** (About photo) | native | 320, 480, 640, **960** | ≥ 960 |

The committed master **is the top rung** (at its own intrinsic width); the generator only writes the rungs strictly *below* the intrinsic width (`variantWidths()`), so nothing is ever upscaled and a small master simply yields a shorter ladder.

## 3. Naming convention

The JSON stores **one** path (`src`) — the canonical master WebP, e.g. `/images/projects/<slug>-thumb.webp`. The generator writes sibling variants by inserting the width before the extension (`variantSrc()`), and `srcSetFor()` in `src/lib/images.js` reconstructs the same names, so a card never references a file the generator didn't write:

```
/images/projects/OVO-thumb.webp        ← committed master (also the top srcset rung, at its intrinsic width)
/images/projects/OVO-thumb-400.webp     ← committed ladder variants
/images/projects/OVO-thumb-800.webp
/images/projects/OVO-thumb-1200.webp
```

Both masters **and** variants are committed (see §7). The ladder widths live in **one constant** (`LADDERS`, `src/lib/images.js`) shared by the frontend and the generator — change them in one place, re-run `npm run images`.

## 4. The `sizes` contract (the part that protects performance)

`sizes` tells the browser the slot's rendered width *before* layout, so it picks the right rung. These are derived from the grid (`src/App.jsx`: `sm:grid-cols-2 lg:grid-cols-3`, `gap-grid`) and `max-w-site`:

| Slot | `sizes` |
| --- | --- |
| **card** | `(min-width: 1024px) min(380px, 31vw), (min-width: 640px) 47vw, 92vw` |
| **gallery** | `(min-width: 768px) min(880px, 90vw), 92vw` |
| **portrait** | `(min-width: 768px) 360px, 80vw` |

These strings live next to the components (they are HTML attributes, not Tailwind classes, so the token linter does not police them — but the values must stay in sync with the layout; the spec is their reference). If the grid breakpoints or `max-w-site` change, update these.

## 5. Quality, CLS, and LCP

- **Quality:** WebP `quality 80` (the shared value in `scripts/generate-images.mjs` and the dump's `convertToWebP`).
- **No layout shift (CLS):** every `<img>` carries intrinsic `width`/`height`. Thumbnails are a fixed 16:10 (the `aspect-thumb` token already reserves space). Gallery images vary, so the dump records each master's intrinsic `width`/`height` into the `Image` record (doc 04) and `ResponsiveImage` renders them.
- **LCP:** the first three above-the-fold cards load with `fetchpriority="high"` and **without** `loading="lazy"` (`ProjectCard priority` prop, set for `index < 3` in `App`); every other image stays `loading="lazy" decoding="async"`. The hero is text, so the LCP element is the first card.

## 6. Performance budget

"Higher res" must not regress speed, so the budget is part of the spec:

- Largest realistically-downloaded **card** image (≈380px slot @2 DPR → 800px rung): **≤ 70 kB** (WebP).
- Largest **gallery** image actually served at the 2560 rung: **≤ 400 kB** (WebP).
- **Lighthouse Performance ≥ 90** (the v1 exit criterion, `docs/05-roadmap.md`) on a throttled mobile run with the grid populated.
- The JS bundle budget (`< 150 kB gzip`) is unaffected — image work adds **zero** runtime JS; `srcset`/`sizes` are static markup.

## 7. Build pipeline

1. **Masters:** the Behance importer (`docs/06-behance-import.md` §5.2) and Decap uploads (doc 07 §6) each commit one top-width WebP master — the `src` in the JSON — with intrinsic `width`/`height` recorded.
2. **`scripts/generate-images.mjs`** reads the masters referenced by `content/`, and for each writes the sub-intrinsic WebP rungs (§2) next to it via `sharp`. It is **idempotent** (skips existing variants) and shares `LADDERS`/`variantWidths`/`variantSrc` with the frontend.
3. **Variants are committed** (`npm run images`, run once after a dump). The build runs the generator first (`build` = `node scripts/generate-images.mjs && vite build`); because variants exist it's a near-instant no-op, and a Decap-added master generates only its own few rungs on that deploy. This supersedes the earlier "generate at build, don't commit" note — committing keeps deploys fast and reliable (no multi-minute re-encode) at the cost of ~250 small files in git.

## 8. Component contract

`src/components/ResponsiveImage.jsx` encapsulates the responsive `<img>` (`srcset` + `sizes` + intrinsic `width`/`height` + `loading`/`fetchpriority`/`decoding`), so `ProjectCard`/`ProjectDetail` don't repeat the markup. Props: `{ src, alt, slot, width, height, eager, className }`; it reads `srcSetFor`/`SIZES` from `src/lib/images.js`. The caller passes an already-localized `alt` (keeps the component i18n-free). Token discipline applies to any classes it carries.
