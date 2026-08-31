# Report — Full-screen frosted detail stage (#7)

**Date:** 2026-08-31
**Scope:** [Issue #7](https://github.com/caioob/joao-kalaf-portifolio/issues/7) — the project detail window becomes full screen with a transparent background, so the home page ghosts slightly behind.
**Status:** ✅ Complete. All six verification gates pass, including a new e2e assertion that the open stage spans the viewport.

## 1. What was delivered

| Area | Delivered |
| --- | --- |
| Full-screen stage | The detail `<dialog>` spans the viewport (`w-screen h-dvh max-w-none max-h-none fixed inset-0 overflow-y-auto`): the UA dialog `max-width`/`max-height` clamps are explicitly uncapped, `dvh` keeps mobile browser chrome honest, and taller projects scroll inside the stage |
| Frosted glass (Q1-a) | Panel is `surface-raised/95` + `backdrop-blur-(--blur-modal)` — the page ghosts softly behind; scrim reduced `overlay/70` → `overlay/20` since the panel itself now dims |
| Content column (Q2-a) | Unchanged layout, now centered: the inner container gains `mx-auto w-full max-w-modal` so the text measure and gallery stay at `--container-modal` (55rem) inside the stage |
| New token | `--blur-modal: 12px` (modest, GPU-friendly) — the blur is load-bearing in a signature component, so it's a token per the brief; runbook §8 gains the 1-line "softer / sharper stage blur" edit |
| Sharp corners | `rounded-card` dropped from the stage (not just token-zeroed) so a future radius change can't round a viewport panel |
| E2E proof | The modal check now asserts the open panel's bounding box ≈ viewport (±2px) in addition to open → title → Esc |
| Docs | Design §2 (overlay token role), §4 (`--container-modal` usage + `--blur-modal` row), §5 (`ProjectDetail` stage note), §8 (runbook row); report + README index |

Everything else preserved per the brief: focus trap/restoration, Esc, ✕ button, `aria-labelledby`, body scroll lock, §6 motion timings, click-outside handler.

## 2. Verification results

Run in the Nix toolchain (Node 22 + nixpkgs Playwright browsers via `PLAYWRIGHT_BROWSERS_PATH`), branch includes the sharp-edge baseline.

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | ✅ clean |
| Token rule | `npm run check:tokens` | ✅ (opacity modifiers + `backdrop-blur-(--blur-modal)` var-shorthand are token-compliant) |
| Tests | `npm run test` | ✅ 75/75 |
| Script tests | `npm run test:scripts` | ✅ 113/113 |
| Build | `npm run build` | ✅ JS 71.69 kB gzip (budget < 150 kB) |
| E2E (canary) | `npm run test:e2e` | ✅ 8/8 — incl. the new viewport-span assertion (`got 1280×720, expected 1280×720`) |

## 3. Deviations from the agent brief

None material. Two micro-decisions worth recording:

1. **`rounded-card` removed from the stage entirely** rather than left to render `0`: a full-screen panel has no corners; leaving the class would re-round it if `--radius-card` ever changes back.
2. **Internal scroll added** (`overflow-y-auto` on the stage): a full-viewport panel must scroll its own content for projects whose gallery exceeds the viewport — the old centered dialog relied on the UA's clamped sizing.

## 4. Issues found & fixed

- **UA dialog clamps are the real work:** the default stylesheet sets `max-width/max-height: calc(100% − 6px − 2em)` on open dialogs — without `max-w-none max-h-none`, a `w-screen` dialog silently clamps a few pixels short of full-screen. The new e2e bounding-box assertion exists precisely to catch that class of regression.

## 5. Decisions of record

- **Frosted glass over plain transparency:** the page shows as a soft ghost (blur + 5% translucency) — preserves text contrast by construction and matches the Navbar's established "translucent surface + blur" language.
- **Stage is a backdrop, content keeps its column:** `--container-modal` survives as the content column width; the visual change is confined to the stage.
- **Blur is a token** (`--blur-modal`), editable in one line per the §8 runbook.

## 6. Next steps

- **Lighthouse sanity on mobile** for the blur cost on low-end GPUs (scrim + blur over a still, scroll-locked page should be cheap, but it deserves a measured check alongside #5's §5 re-run).
- **Same-artwork cover upgrades for `Dragoes-urbanos` / `Infusor-de-cha…`** remain opt-in follow-ups on #5.
- **Importer/generator thumbnail caps** (2400×1500) remain the pipeline follow-up from #5.
