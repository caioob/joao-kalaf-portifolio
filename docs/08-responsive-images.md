# 08 — Responsive Images

**Goal:** higher-resolution imagery (crisp on large/retina displays) **without** a performance regression. The lever is responsive delivery — ship many sizes and modern formats, let the browser download only the smallest file that fills the slot at the device's pixel density.

This spec is the source of truth for the image pipeline (`scripts/lib/behance-images.mjs` and the Decap build step, doc 07), the `Image` schema (doc 04), and the rendering components (`ProjectCard`, `ProjectDetail`, About portrait).

## 1. Formats

Each raster image is emitted in two formats, served via `<picture>`:

| Format | Role | Notes |
| --- | --- | --- |
| **AVIF** | primary | ~30–50% smaller than WebP at equal quality — this is what buys "more resolution for the same bytes". |
| **WebP** | fallback | universal support; what we ship today. |

No JPEG/PNG fallback — WebP support is universal in our 2026 baseline (`docs/01-product-spec.md` browser matrix). Source masters may be any format; outputs are always AVIF + WebP.

## 2. Width ladders

A "ladder" is the set of widths generated per image. `sizes` (§4) decides which rung the browser actually downloads.

| Slot | Aspect | Ladder (px wide) | Master min |
| --- | --- | --- | --- |
| **thumbnail** (grid card) | 16:10 (cropped) | 320, 480, 640, 800, 1100, 1600 | ≥ 1600 |
| **gallery** (detail modal) | native (no crop) | 640, 960, 1280, 1600, 2048, **2560** | ≥ 2048 |
| **portrait** (About photo) | native | 320, 480, 640, 960 | ≥ 960 |

The 2560-wide gallery rung is the "high resolution" headroom — only fetched by large, high-DPR screens. `withoutEnlargement: true`: never upscale past the master, so a smaller master simply produces a shorter ladder (no blurry upscales).

## 3. Naming convention (derived, not stored)

The JSON stores **one** path — the canonical largest WebP, exactly as today (`src`). Variants are siblings the pipeline guarantees, derived by convention so the content layer can build `srcset` without the JSON listing every file:

```
/images/projects/<slug>-thumb.webp          ← canonical src (back-compat)
/images/projects/<slug>-thumb-320.avif       ← ladder variants
/images/projects/<slug>-thumb-320.webp
/images/projects/<slug>-thumb-640.avif
...
```

The ladder widths and formats live in **one constant** in the content layer (`src/lib/images.js`), the single source of truth a helper uses to expand `src` → `srcset`. Changing the ladder is a one-line edit there plus a pipeline re-run — mirroring the "tokens or nothing" discipline (`docs/03-design-system.md`).

## 4. The `sizes` contract (the part that protects performance)

`sizes` tells the browser the slot's rendered width *before* layout, so it picks the right rung. These are derived from the grid (`src/App.jsx`: `sm:grid-cols-2 lg:grid-cols-3`, `gap-grid`) and `max-w-site`:

| Slot | `sizes` |
| --- | --- |
| **card** | `(min-width: 1024px) min(380px, 31vw), (min-width: 640px) 47vw, 92vw` |
| **gallery** | `(min-width: 768px) min(880px, 90vw), 92vw` |
| **portrait** | `(min-width: 768px) 360px, 80vw` |

These strings live next to the components (they are HTML attributes, not Tailwind classes, so the token linter does not police them — but the values must stay in sync with the layout; the spec is their reference). If the grid breakpoints or `max-w-site` change, update these.

## 5. Quality, CLS, and LCP

- **Quality:** AVIF `quality ≈ 52`, `effort 4`; WebP `quality ≈ 80`. Tuned to the per-image budget (§6), not fixed forever.
- **No layout shift (CLS):** every `<img>` carries intrinsic `width`/`height`. Thumbnails are a fixed 16:10 (the `aspect-thumb` token already reserves space). Gallery images vary, so the pipeline records each master's intrinsic `width`/`height` into the `Image` record (doc 04) and the component renders them to reserve space.
- **LCP:** the first above-the-fold card image loads with `fetchpriority="high"` and **without** `loading="lazy"`; every other image stays `loading="lazy" decoding="async"`. The hero today is text, so the LCP element is the first card or the portrait.

## 6. Performance budget

"Higher res" must not regress speed, so the budget is part of the spec and checked per report:

- Largest realistically-downloaded **card** image (≈380px slot @2 DPR ≈ 760px rung): **≤ 70 kB** (AVIF).
- Largest **gallery** image actually served at the 2560 rung: **≤ 400 kB** (AVIF).
- **Lighthouse Performance ≥ 90** (the v1 exit criterion, `docs/05-roadmap.md`) must hold on a throttled mobile run with the grid populated.
- The JS bundle budget (`< 150 kB gzip`) is unaffected — image work adds **zero** runtime JS; `srcset`/`sizes`/`<picture>` are static markup.

## 7. Build pipeline

1. **Both sources supply one canonical master per image:** the Behance importer (`docs/06-behance-import.md` §5.2) and Decap uploads (doc 07 §6) each commit a single top-width WebP — the `src` in the JSON.
2. A shared step (generalized `sharp` logic from `scripts/lib/behance-images.mjs`) expands each master into the AVIF + WebP ladder (§2) plus the 16:10 thumbnail crop and records intrinsic `width`/`height`.
3. **The ladder is generated at build, not committed** (decided in doc 02 §7): only canonical masters live in git; derived rungs/AVIF are produced into the deployed output. The step is idempotent (skips up-to-date variants). `npm run images` runs it against the working tree for local preview after a dump.

This is the single optimization seam: Decap and the Behance importer feed masters into the *same* step, so resolution and performance are handled identically regardless of source — the dump is not a lower-quality path.

## 8. Component contract

A small presentational helper (`src/components/Picture.jsx`, or an `Image` component) encapsulates `<picture>` + `srcset` + `sizes` + dimensions, so `ProjectCard`/`ProjectDetail` don't repeat the markup. It takes `{ src, alt, slot, eager?, width?, height? }` and reads the ladder/`sizes` from `src/lib/images.js`. Token discipline applies to any classes it carries.
