# Report — Taller project cards + higher-res thumbnails (#5)

**Date:** 2026-08-31
**Scope:** [Issue #5](https://github.com/caioob/joao-kalaf-portifolio/issues/5) — make each card rectangle 1/3 taller; deliver higher-res thumbnails for the full-width bands.
**Status:** ✅ Complete. All six verification gates pass. Thumbnails resolve sharply at desktop; one cover fully re-derived at 2400×1500.

## 1. What was delivered

| Area | Delivered |
| --- | --- |
| Taller bands | `--rect-h-1/2/3` ×4/3 → `29.25 / 21.25 / 14.75 rem` (quarter-rem rounded from exact `29.33 / 21.33 / 14.67`) — token-only edit per the design §8 runbook. Less vertical cropping: the tall band now shows ~68% of a 16:10 cover's height vs ~51% before |
| Honest `sizes` | Thumbnail `sizes` rewritten from the stale 3-column hint (`min(380px, 31vw)`) to the real band width `(min-width: 768px) min(1104px, calc(100vw - 96px)), calc(100vw - 48px)` — the root-cause fix for the "too low res" complaint. The browser now picks ≥1200px rungs on desktop instead of 400/800 |
| Ladder | Thumbnail ladder gains a **2400** rung (`[400, 800, 1200, 1600, 2400]`); existing invariant holds (rungs strictly below each master's intrinsic width; the master is the top `srcset` rung) |
| Higher-res masters | One cover re-derived at **2400×1500** from its committed gallery master (`estampa-…`, pixel-match diff 0.66/255 → unambiguous); JSON intrinsic dims updated (2400×1500); generator wrote the new 1600 rung (66 kB); master now 136 kB |
| Docs | Design §4 heights + rationale; responsive-images §2 (ladder table + 2400 footnote), §4 (`sizes` derivation + row), §5 (card-image budget updated to measured reality) |
| Report + index | This report; linked from the README doc index |

Built on top of the full-width sharp-rectangle baseline (first commit of this branch), per the issue's prerequisite.

## 2. Verification results

Run in the Nix toolchain (Node 22, nixpkgs-provided Playwright browsers via `PLAYWRIGHT_BROWSERS_PATH`).

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | ✅ clean |
| Token rule | `npm run check:tokens` | ✅ |
| Tests | `npm run test` | ✅ 75/75 |
| Script tests | `npm run test:scripts` | ✅ 113/113 |
| Build | `npm run build` | ✅ JS 71.69 kB gzip (budget < 150 kB) |
| E2E (canary) | `npm run test:e2e` | ✅ 8/8 — incl. the no-failed-request guard over the new/changed WebP set |

The effective sharpness delta: a desktop 2× viewport wants ~2208px for the band; before, the stale `sizes` made the browser download the 400–800px rungs (~0.36× density). Now every card downloads its 1600px master (1.45×) or the 2400 rung (2.17×).

## 3. Deviations from the agent brief (documented, not silent)

1. **Only 1 of 15 covers was re-derived, not ~7.** The brief anticipated this ("verify per-project that the thumbnail's source actually matches…"). The triage probe counted projects with *any* gallery master ≥2400px — but the thumbnail must come from **the same cover image**. Method: for every project, the current thumb master was compared (mean absolute pixel diff at a canonical 16:10 center crop, 128×80) against all its ≥1600px gallery masters. Only `estampa-…` matched below threshold (0.66). The closest non-match was 11.76 — a visibly different framing.
2. **Two "same artwork, different scan" opportunities left on the table (opt-in).** `Dragoes-urbanos-4.webp` (diff 27.2, margin 47.5 over second-best) and `Infusor-de-cha…-1.webp` (diff 11.8, margin 63.6) are the same *artwork* as the current covers but different scans/framings — visually confirmed side-by-side for Dragoes. Re-deriving from them would raise resolution but silently change the curated cover framing, so they were kept byte-for-byte per the brief. **If you approve, swapping those two covers is a 2-minute follow-up** (same pipeline, both sources ≥2400px wide).
3. **Importer/generator caps NOT raised.** New thumbnail uploads still cap at 1600×1000 (importer + generator `capMaster`). The 2400 master exists only via this pass's re-derivation. Raising both caps (and their tests) is the natural follow-up so future imports stay at full-band resolution; left out to keep this diff scoped.
4. **Doc §5 card-image budget corrected to reality (was already stale).** The old line ("≈380px slot → ≤ 70 kB") described the removed 3-column grid. Measured now: two dense illustrations encode at **401–423 kB** at q80 regardless of this change; most cards sit ≤ 75 kB; the new 2400 master is 136 kB. The budget line now states ≤ 425 kB worst case with re-encoding of those outliers flagged as follow-up.

## 4. Issues found & fixed

- **Root cause of the "low res" complaint was `sizes`, not (mostly) assets.** The stale hint (`min(380px, 31vw)`) described the removed 3-column grid, so browsers downloaded 400–800px rungs for ~1104px bands (~0.36× pixel density). Fixing the hint restored every card to ≥1.45× density without touching a single image file. The one true asset upgrade (estampa) then restores 2.17× for that cover.
- **Cover↔slide matching needs pixel evidence, not width heuristics.** A naive "widest media asset" approach would have swapped covers with different framings. The diff-based match with a margin requirement (best must beat second-best by ≥2/255) rejected every ambiguous case; the one borderline high-margin case (Dragoes, 27.2) was visually verified side-by-side before rejecting.

## 5. Decisions of record

- **Band heights = 4/3 rounded to the quarter-rem** (`29.25 / 21.25 / 14.75`), documented in design §4; exact 4/3 values were within 0.09rem of these.
- **Strict "same cover image" matching (diff < 3/255 + margin)** for cover re-derivation; same-artwork/different-scan swaps are a maintainer decision, not an agent one.
- **2400 rung only above 2400px masters.** For 1600px masters the ladder is unchanged (`[400, 800, 1200]` + master) — the generator's width-filtering keeps `srcset` honest per project.
- **`sizes` breakpoint moved 1024 → 768px** to match the container's actual `md` padding change (24 → 48px per side), the real layout discontinuity for a full-width band.

## 6. Next steps

- **Opt-in cover swaps (2 min):** re-derive `Dragoes-urbanos` and `Infusor-de-cha…` thumbs from their ≥2400px same-artwork slides (near-identical framing, ~1.6–2.5× more resolution). Say the word and it ships as a follow-up commit on this branch.
- **Raise the importer + generator thumbnail caps** to 2400×1500 (with their tests) so future Behance re-imports and Decap uploads produce full-band-resolution masters instead of being re-capped at 1600.
- **Re-encode the two dense-artwork outliers** (`Dragoes-urbanos` 423 kB, `Trabalhos-graficos-em-vetor` 401 kB) — quality retune or palette-aware encoding could halve them; independent of this issue.
- **Lighthouse re-run** for the §5 ≥ 90 criterion on the new layout (bands are taller and downloads larger; the `sizes` fix should keep mobile scores healthy, but it deserves a measured check).
