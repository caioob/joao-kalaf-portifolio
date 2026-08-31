# Report — Card → detail transition (#8)

**Date:** 2026-08-31
**Scope:** [Issue #8](https://github.com/caioob/joao-kalaf-portifolio/issues/8) — clicking a project card animates its thumbnail forward into the detail view's hero; closing reverses it.
**Status:** ✅ Complete. All six verification gates pass, including new e2e assertions that the View Transition actually runs on open and close.

## 1. What was delivered

| Area | Delivered |
| --- | --- |
| Shared-element morph | The clicked `ProjectCard` thumbnail morphs into a new hero at the top of `ProjectDetail`; closing collapses the hero back into the originating card slot. Implemented with the native View Transitions API — zero new runtime deps. |
| Shared name | `view-transition-name: detail-hero`. The clicked card's thumbnail wrapper carries it in the old state; the detail hero carries it in the new state. Exactly one element per snapshot, so a fixed name needs no per-item bookkeeping (avoiding the duplicate-name break). |
| React coordination | `ReactDOM.flushSync` inside the `startViewTransition` callback forces React to commit before the new-state snapshot. `showModal()` moved from a passive `useEffect` to a callback ref so it fires during that commit — the `<dialog>` is already in the top layer when captured (the `display:none`/top-layer timing trap). |
| Detail hero | New hero (the project cover, `slot="thumbnail"` so it's the same variants as the card) at the top of the detail; the rest of the detail content cross-fades in as the transition's root group. |
| Timing | Morph duration/easing reuse `--duration-slow` / `--ease-standard` via `::view-transition-group/old/new(detail-hero)` in `src/styles/index.css` — no new token. |
| Fallback | `startViewTransition` unsupported, or `prefers-reduced-motion: reduce` → instant open/close (previous behavior). A reduced-motion rule on the transition pseudos is a belt-and-suspenders guard. |
| A11y | Native `<dialog>` still owns the focus trap, Esc (`onCancel`, now `preventDefault`-ed so the transition drives the exit), click-outside, and body scroll lock. **Focus returns to the opener card on close** via an explicit `openerRef` restore (the dialog is unmounted, not `.close()`'d, so native focus return never fired — a latent gap the issue's acceptance criteria called out). |
| E2E proof | The modal test now spies on `document.startViewTransition`, asserts it ran on open (≥1 call) and close (≥2 calls), and that the open detail hero carries `view-transition-name: "detail-hero"`. |
| Docs | Design §5 (card→hero morph note), §6 (transition spec: mechanism, shared name, timing, coordination, fallback, a11y), §8 (runbook row for "Card morph faster / slower"); this report. |

## 2. Verification results

Run in the Nix toolchain (Node 22) with nixpkgs Playwright browsers (`PLAYWRIGHT_BROWSERS_PATH`, chromium-1228 matching the `playwright@1.61` pin) so the real VT path is exercised.

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | ✅ clean |
| Token rule | `npm run check:tokens` | ✅ (inline `viewTransitionName` styles + `::view-transition-*` CSS reference `var(--*)` tokens — no raw visual values outside `theme.css`) |
| Tests | `npm run test` | ✅ 75/75 (jsdom has no `startViewTransition` → exercises the instant fallback path) |
| Script tests | `npm run test:scripts` | ✅ 113/113 |
| Build | `npm run build` | ✅ JS 72.07 kB gzip (budget < 150 kB); CSS 24.73 kB / 5.45 kB gzip |
| E2E (real VT) | `npm run test:e2e` | ✅ 8/8 — incl. new VT-spy + hero-name assertions |

## 3. Deviations from the agent brief

None material. Two implementation decisions worth recording:

1. **Single fixed `detail-hero` name, not per-id names.** The issue's "same name on card and hero" implies per-card names, but the clicked card persists in the grid behind the full-screen dialog (#7), so a stable per-id name would collide in the new state. A single name works because it's carried by exactly one element per snapshot (card in old, hero in new), kept unique declaratively via an `transitioningId` state bit — no DOM element hunting, no per-item cleanup.
2. **`showModal` in a callback ref, not `useEffect`.** A passive effect runs after paint — too late for the VT new-state snapshot, which would capture a `display:none` dialog and never morph it. The callback ref fires during the `flushSync` commit, inside the transition callback, so the dialog is open at capture time.

## 4. Issues found & fixed

- **`<dialog>` + View Transitions is genuinely fraught** (top-layer z-order; `display:none` at snapshot time; Escape's native close racing the old-state snapshot). Solved by: callback-ref `showModal` + `flushSync`, `preventDefault` on `onCancel`, and giving only the hero a `view-transition-name` (the dialog/backdrop stay in the root cross-fade, so the morph group paints over the settling panel as intended).
- **Focus didn't return to the card on close** (pre-existing): the dialog is unmounted rather than `.close()`'d, so the browser's native focus-return never fires. Fixed with an explicit `openerRef` captured at `showModal` and restored in the effect cleanup — satisfies the issue's "focus moves into the detail and returns to the card on close" criterion.

## 5. Decisions of record

- **Native View Transitions over FLIP** — the issue preferred it; graceful fallback is a one-line feature-detect; the repo's e2e (Chromium) actually exercises it, so regressions surface. FLIP (the issue's allowed alternative) remains the documented fallback if VT+dialog proves fragile on some target.
- **No new motion token** — the morph reuses `--duration-slow`, so the existing "Snappier / smoother animations" runbook edit already tunes it (plus a dedicated "Card morph faster / slower" row pointing at the `index.css` rule).
- **Manual `startViewTransition` over React's experimental `<ViewTransition>`** — the latter isn't in stable React 22 and using it would be a risk/spec change; the `flushSync`-in-callback pattern is the documented manual approach.

## 6. Next steps

- **Lighthouse / low-end-GPU sanity** for the blur+morph cost (already flagged for #7; the morph adds a single named-group snapshot, so it should be cheap).
- **`prefers-reduced-motion` is JS-skipped, not just CSS-killed** — if a stricter "no transitions at all" policy is wanted, the global `index.css` reduced-motion rule could be widened to `::view-transition-*`, but the current JS guard is sufficient.
- **`adobe-ccv` projects** still have no poster; the hero uses the Behance cover thumbnail, which is fine, but a first-frame poster for the video cover would make the morph into a video project crisper.
