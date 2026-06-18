# 2026-06-17 — Responsive image system (v2 Step 2)

Roadmap: [05 — v2 Step 2](../05-roadmap.md). Spec: [08 — Responsive Images](../08-responsive-images.md). Delivers responsive image delivery so the browser fetches the right resolution per viewport — crisp on retina, light on mobile.

## Delivered

- **`src/lib/images.js`** — single source of truth: `LADDERS` (4 widths/slot), `SIZES`, `variantSrc`, `variantWidths`, `srcSetFor`. Pure (no imports) so the Node generator shares it.
- **`src/components/ResponsiveImage.jsx`** — WebP `<img srcset sizes>` (no `<picture>` — WebP-only), intrinsic `width`/`height` for CLS, `eager`→`fetchpriority="high"` + non-lazy.
- **Converted** `ProjectCard` (thumbnail slot, `priority` for the first 3 cards via `App`) and `ProjectDetail` (gallery slot; also fixes prior gallery CLS).
- **`scripts/generate-images.mjs`** — reads masters from `content/`, writes sub-intrinsic WebP rungs via `sharp`; idempotent; shares `LADDERS` with the frontend. Wired as `npm run images` and the `build` prebuild step.
- **236 variants generated and committed** under `public/images/projects/`.

## Decision (deviates from the original doc 08 spec)

**WebP-only, 4 widths, variants committed** (was AVIF+WebP, 6 widths, build-time/not-committed). Rationale: AVIF re-encode of ~1,000 files on every ephemeral Vercel build would add minutes; WebP-only keeps the committed footprint to ~250 small files (~build-cost near zero, deploys stay fast). `srcset`/`sizes` over a WebP ladder still delivers the core "right resolution per viewport" win. Docs 08 + 02 §7 updated to match.

## Verification

| Check | Result |
| --- | --- |
| `npm run images` | 236 generated; re-run → 236 skipped (idempotent) |
| `npm run lint` / `check:tokens` | pass (component adds no arbitrary values) |
| `npm run test` | 65 pass — incl. new `src/lib/images.test.js` (7) |
| `npm run test:scripts` | pass |
| `npm run test:e2e` | 8/8 — proves every `srcset` variant URL resolves (no `/images` 404s) |
| `npm run build` | pass — **71.6 kB gzip JS** (budget < 150 kB; zero added runtime JS) |

**Responsive selection (headless browser, real DPR):** mobile @1x → `…-400.webp`; mobile @3x → `…-1200.webp`; retina laptop @2x → `…-800.webp`. The browser picks the smallest sufficient file — exactly the goal.

## Performance budget — partially met, tail over

Measured WebP sizes (the budget in doc 08 §6 was written assuming AVIF, ~30–50% smaller):

| Slot / rung | min | median | max | budget |
| --- | --- | --- | --- | --- |
| card retina (`-thumb-800`) | 8 kB | **20 kB** | 140 kB | ≤ 70 kB |
| gallery top rung (master) | 8 kB | **76 kB** | **1376 kB** | ≤ 400 kB |

- **Medians are well within budget.** The tail is detailed full-bleed illustrations: 2/15 card rungs (max 140 kB) and a few gallery masters (max 1.3 MB at 2560px) exceed it.
- **Exposure is narrow:** gallery images are lazy + behind a modal click, and only the top rung loads on large/retina screens; mobile pulls the 640px rung. Above-the-fold cards load the 400px rung (~8–20 kB).
- **Not yet measured:** Lighthouse Performance ≥ 90 (deferred — needs a throttled run).

## Issues found & fixed

- Initial `srcset` would have starved large/intrinsic-width masters by listing only sub-intrinsic rungs; `srcSetFor` adds the master itself at its intrinsic width as the top rung, so the full-res file stays selectable. Covered by `images.test.js`.

## Decisions of record

- The committed master doubles as the top `srcset` rung; the generator only writes rungs **below** intrinsic width (no upscaling, files and `srcset` stay aligned via shared `LADDERS`).
- First 3 cards are eager/high-priority (LCP); all else lazy.

## Next steps

- **Optional quality tune:** drop WebP quality (80 → ~74) and/or revisit the heaviest gallery masters if the tail weight matters; re-run `npm run images`. Cheap, reversible.
- Run Lighthouse to confirm ≥ 90 with the grid populated.
- Step 3 — Decap admin UI (doc 07).
