# Design System — Gangster Green & Black

A dark, mob-money aesthetic: near-black surfaces with a green undertone, a single vivid "money green" accent used sparingly, and off-white green-tinted text. Pinstripe-quiet chrome; the green is the only voice.

**Token-driven.** Every value below lives in `src/styles/theme.css` (Tailwind v4 `@theme`). The edit happens there and nowhere else — see [§8 runbook](#8-change-runbook). Same rules as before: no raw hex outside `theme.css`; components use semantic utilities only (`bg-surface`, `text-ink`, `text-accent`, …).

## 1. Principles

1. **Dark first.** Surface is the void; content glows.
2. **One accent — money green.** If it doesn't need the green, it's neutral.
3. **Type does the branding.** Strong display face, confident scale, no logos.
4. **Calm motion.** Animation confirms interaction, never decorates.
5. **Tokens or nothing (hard rule).** No raw palette classes, arbitrary values, or literal colors outside `theme.css`. Enforced by CI.

## 2. Color tokens

| Token                    | Value                            | Usage                                           | Contrast on surface |
| ------------------------ | -------------------------------- | ----------------------------------------------- | ------------------- |
| `--color-surface`        | `#0A0F0A` (green-tinted black)   | Page background                                 | —                   |
| `--color-surface-raised` | `#131A13` (raised green-black)   | Cards, modal                                    | —                   |
| `--color-ink`            | `#E6F2E6` (off-white, green tint)| Headings, body                                  | ~16:1 ✓             |
| `--color-ink-muted`      | `#7B9A7E` (muted sage)           | Secondary text, captions                        | ~6.4:1 ✓            |
| `--color-line`           | `#1E2B1E` (dark green hairline)  | Hairline borders, dividers                      | —                   |
| `--color-accent`         | `#2ED573` (money green)          | Large text, icons, hover, focus ring             | ~9:1 ✓              |
| `--color-accent-strong`  | `#00C853` (deep money green)     | Body-size accent text — ≥ 4.5:1 on surface ✓   | ~8.7:1 ✓            |
| `--color-accent-ink`     | `#0A0F0A` (dark on green)        | Text on accent backgrounds (dark-on-bright ✓)   | —                   |
| `--color-overlay`        | `#000000` (black)                | Modal backdrop scrim (`bg-overlay/70`)          | —                   |

`accent` and `accent-strong` form a pair. On this dark surface **both** pass 4.5:1, but `accent-strong` is still reserved for body-size accent text by convention. When the accent changes, re-derive `accent-strong` so it keeps ≥ 4.5:1 on `surface` (check with any contrast tool). No other hex value may appear anywhere in the codebase.

Category chips use `ink-muted` text on `line`-tinted backgrounds — categories are _not_ color-coded.

## 3. Typography

Unchanged from the light system — same faces and scale. Type carries the brand; the palette change doesn't touch type.

| Token            | Value                                             | Use                          |
| ---------------- | ------------------------------------------------- | ---------------------------- |
| `--font-display` | **Rubik**                                         | Display headings             |
| `--font-sans`    | **Inter** (variable)                              | UI & body                    |
| `--text-display` | `clamp(2.5rem, 6vw, 4rem)`, lh 1.05, tracking −1% | Hero name                    |
| `--text-h2`      | `clamp(1.75rem, 4vw, 2.25rem)`, lh 1.15           | Section titles               |
| `--text-h3`      | `clamp(1.1875rem, 2vw, 1.375rem)`, lh 1.3         | Card/modal titles            |
| `--text-body`    | `1.0625rem` (17px), lh 1.6                        | Paragraphs, max-width `65ch` |
| `--text-small`   | `0.875rem` (14px), lh 1.45                        | Chips, captions, footer      |

## 4. Layout, spacing, grid

Unchanged.

| Token               | Value             | Usage                          |
| ------------------- | ----------------- | ------------------------------ |
| `--container-site`  | `75rem` (1200px)  | Content max-width              |
| `--container-modal` | `55rem` (880px)   | Project detail modal width     |
| `--spacing-section` | `clamp(2rem, 5vw, 3rem)` | Vertical rhythm         |
| `--spacing-grid`    | `1.5rem` (24px)   | Work grid gap                   |
| `--radius-card`     | `0.75rem`         | Cards, modal, thumbnails       |
| `--aspect-thumb`    | `16 / 10`         | Project thumbnails             |

## 5. Component notes (dark-mode deltas)

Same inventory as the light system. Only behavior that depends on color:

- `Navbar` — translucent `surface` + blur; hairline bottom border now uses `line` (`#1E2B1E`) on scroll.
- `FilterBar` — active pill = `accent-strong` text + `accent` hairline underline.
- `ProjectCard` hover — title gains `accent-strong`; thumbnail scales 1.02.
- `:focus-visible` ring — 2px `accent` (`#2ED573`), 2px offset. The bright green ring reads strongly on black.
- `ProjectDetail` backdrop — `bg-overlay/70` (not `ink`-based): the page is already near-black, so the scrim must be darker than `surface` to dim it. `overlay` (`#000`) is the only token darker than the page.

## 6. Motion

Unchanged.

| Token             | Value                                   | Usage                           |
| ----------------- | --------------------------------------- | ------------------------------- |
| `--duration-fast` | `150ms`                                 | Hover, focus, color changes     |
| `--duration-slow` | `250ms`                                 | Modal enter/exit, scroll reveal |
| `--ease-standard` | `cubic-bezier(0, 0, 0.2, 1)` (ease-out) | All transitions                 |

## 7. Accessibility rules

- Text contrast ≥ 4.5:1. `ink` (~16:1) and `ink-muted` (~6.4:1) pass on `surface`; `accent-strong` (~8.7:1) passes and is used for body-size accent text. `accent` (~9:1) also passes but is reserved for large text (≥24px), icons, focus ring, decorative emphasis.
- Text on accent backgrounds = `accent-ink` (`#0A0F0A`, dark-on-bright green ✓).
- `:focus-visible` ring: 2px `accent`, 2px offset, on every interactive element.
- Modal: `role="dialog"` `aria-modal`, labelled by project title, focus trapped/restored.
- All images require `alt`; decorative glyphs `aria-hidden`.
- State communicated via `aria-pressed` + underline/weight, not color alone.
- Hit targets ≥ 44×44px on touch.

## 8. Change runbook

| Client request                      | Edit                                                            | Size             |
| ----------------------------------- | --------------------------------------------------------------- | ---------------- |
| "Different accent color"            | `--color-accent` + re-derive `--color-accent-strong`             | 2 lines          |
| "Whole palette too dark/light"      | The 8 color tokens in §2                                        | 8 lines          |
| "Headings bigger / smaller"         | `--text-display`, `--text-h2`                                   | 1–2 lines        |
| "More / less white space"           | `--spacing-section`                                             | 1 line           |
| "Site feels too narrow / wide"      | `--container-site`                                              | 1 line           |
| "Rounder / sharper cards"           | `--radius-card`                                                 | 1 line          |
| "Snappier / smoother animations"    | `--duration-fast`, `--duration-slow`                            | 2 lines          |
| "Different heading font"            | ① drop woff2 in `public/fonts/` ② swap `@font-face` in `index.css` ③ update `--font-display` | 3 steps, 2 files |

---

## Apply it — exact file edits

### A. `src/styles/theme.css`

Replace the color block (keep typography/layout/motion untouched):
