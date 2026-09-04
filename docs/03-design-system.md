# Design System — Blood Red & Black

A stark print-editorial look: paper-white surfaces, blood-red type, and quiet black chrome. The red does the talking; every other value stays out of the way.

**Token-driven.** Every value below lives in `src/styles/theme.css` (Tailwind v4 `@theme`). The edit happens there and nowhere else — see [§8 runbook](#8-change-runbook). Same rules as before: no raw hex outside `theme.css`; components use semantic utilities only (`bg-surface`, `text-ink`, `text-accent`, …).

## 1. Principles

1. **Light first.** Surface is paper; content is set in red ink and carries itself.
2. **One accent — black.** Chrome (fills, borders, hover, focus) is monochrome. Red is reserved for type (`ink`), never for fills.
3. **Type does the branding.** Strong display face, confident scale, no logos.
4. **Calm motion.** Animation confirms interaction, never decorates.
5. **Tokens or nothing (hard rule).** No raw palette classes, arbitrary values, or literal colors outside `theme.css`. Enforced by CI.

## 2. Color tokens

| Token                    | Value                            | Usage                                           | Contrast on surface |
| ------------------------ | -------------------------------- | ----------------------------------------------- | ------------------- |
| `--color-surface`        | `#fff5f5` (white)   | Page background                                 | —                   |
| `--color-surface-raised` | `#333132` (black)   | Cards, modal — the dark fills sitting on the paper | —                   |
| `--color-ink`            | `#d60302` (blood red)      | Headings, body                                  | ~5.1:1 ✓            |
| `--color-ink-muted`      | `#333132` (black)           | Secondary text, captions                        | ~12.1:1 ✓           |
| `--color-line`           | `#333132` (black)  | Hairline borders, dividers                      | —                   |
| `--color-accent`         | `#333132` (black)          | Filled CTAs, icons, hover, focus ring            | ~12.1:1 ✓           |
| `--color-accent-strong`  | `#333132` (black)     | Body-size accent text — ≥ 4.5:1 on surface ✓   | ~12.1:1 ✓           |
| `--color-accent-ink`     | `#fff5f5` (surface white — **derived**, see below) | Text on accent/`line`-colored fills (light-on-black ✓) | ~12.1:1 on the accent |
| `--color-overlay`        | `#333132` (black)                | Faint scrim under the full-screen detail stage (`bg-overlay/20`) | —                   |

`accent-ink` is derived: the table's literal value (`#333132`) equaled the accent fill itself, which would render text on accent backgrounds invisible. Per the re-derivation convention below it is re-derived to `surface` white — 12.1:1 on the black accent. Designer-approved 2026-09-03 (issue #2) — do not revert to the literal table value.

`accent` and `accent-strong` form a pair. On this white surface **both** pass 4.5:1 — in the current palette they collapse to the same black value, so accent fills have no visible hover shift until the palette differentiates them again. When the accent changes, re-derive `accent-strong` (≥ 4.5:1 on `surface`) and `accent-ink` (≥ 4.5:1 on `accent`) — check with any contrast tool. No other hex value may appear anywhere in the codebase.

The dark fills invert the on-colors: text sitting on `surface-raised` or `accent`/`line`-colored fills uses the `surface` family (`text-surface`, `text-surface/70`, `accent-ink`), never `ink` — blood red on charcoal fails contrast (~2.4:1).

Category chips use `ink-muted` text with `line` hairline borders on `surface` — categories are _not_ color-coded.

## 3. Typography

Unchanged from the light system — same faces and scale. Type carries the brand; the palette change doesn't touch type. Fonts are self-hosted in `public/fonts/`: **Neue Montreal** as static OTFs (400/500/700) and **DM Sans** as a variable woff2 (100–900).

| Token            | Value                                             | Use                          |
| ---------------- | ------------------------------------------------- | ---------------------------- |
| `--font-display` | **Neue Montreal**                                         | Display headings             |
| `--font-sans`    | **DM Sans** (variable)                              | UI & body                    |
| `--text-display` | `clamp(3rem, 8vw, 6rem)`, lh 1.05, tracking −1% | Hero name — the statement of the trimmed page |
| `--text-h2`      | `clamp(1.75rem, 4vw, 2.25rem)`, lh 1.15           | Section titles               |
| `--text-h3`      | `clamp(1.1875rem, 2vw, 1.375rem)`, lh 1.3         | Card/modal titles            |
| `--text-body`    | `1.0625rem` (17px), lh 1.6                        | Paragraphs, max-width `65ch` |
| `--text-small`   | `0.875rem` (14px), lh 1.45                        | Chips, captions, footer      |

## 4. Layout, spacing, grid

Unchanged.

| Token               | Value             | Usage                          |
| ------------------- | ----------------- | ------------------------------ |
| `--container-site`  | `75rem` (1200px)  | Content max-width              |
| `--container-modal` | `55rem` (880px)   | Project detail content column (centered in the full-screen stage) |
| `--blur-modal`      | `12px`            | Detail stage frosted-glass `backdrop-blur`     |
| `--spacing-section` | `clamp(2rem, 5vw, 3rem)` | Vertical rhythm         |
| `--spacing-grid`    | `1.5rem` (24px)   | Work grid gap                   |
| `--radius-card`     | `0`               | Cards, modal, thumbnails (sharp edges across the whole design) |
| `--rect-h-1`        | `29.25rem`        | Project card — tall rectangle (cycle index 0, 3, …) |
| `--rect-h-2`        | `21.25rem`        | Project card — medium rectangle (cycle index 1, 4, …) |
| `--rect-h-3`        | `14.75rem`        | Project card — short rectangle (cycle index 2, 5, …) |

Heights are 4/3 of the original `22/16/11rem` (quarter-rem rounded) so the full-width bands crop less vertically and show more of each project.

## 5. Component notes (palette-dependent behavior)

Same inventory as the light system. Only behavior that depends on color:

- `Navbar` — translucent `surface` + blur; hairline bottom border uses `line` (`#333132`) on scroll.
- `FilterBar` — active pill = `accent-strong` text + `accent` hairline underline.
- `LanguageToggle` — active pill = `accent` fill + `accent-ink` text (the standard on-fill pair).
- `ProjectCard` hover — title shifts `ink` (red) → `accent-strong` (black); thumbnail scales 1.02. The video badge is a `surface-raised/90` fill with `surface` text.
- `:focus-visible` ring — 2px `accent` (`#333132`), 2px offset. The black ring reads clearly on paper white.
- `ProjectDetail` stage — full-screen frosted glass, now a dark panel on the light site: the panel is `surface-raised/90` + `backdrop-blur-(--blur-modal)` so the home page ghosts softly behind it; the scrim is `bg-overlay/20` (`overlay` is the only token darker than the page). Everything inside the stage uses light on-dark tokens — `text-surface` for the title/links, `text-surface/70` for meta/body, `border-surface/25` hairlines — because `ink` (red) and `ink-muted`/`line` (the panel's own value) are unreadable on the charcoal panel. Content keeps its centered `--container-modal` column inside the stage.
- `ProjectCard` → `ProjectDetail` morph — clicking a card animates its thumbnail into the detail's hero via the View Transitions API; closing reverses it. The clicked card's thumbnail wrapper and the detail hero share one `view-transition-name` (`detail-hero`), carried by exactly one element per snapshot so a fixed name stays unique. Unsupported browsers and `prefers-reduced-motion` fall back to the instant open/close.

## 6. Motion

| Token             | Value                                   | Usage                           |
| ----------------- | --------------------------------------- | ------------------------------- |
| `--duration-fast` | `150ms`                                 | Hover, focus, color changes     |
| `--duration-slow` | `250ms`                                 | Modal enter/exit, scroll reveal |
| `--ease-standard` | `cubic-bezier(0, 0, 0.2, 1)` (ease-out) | All transitions                 |

### Card → detail transition (issue #8)

A shared-element morph: the clicked `ProjectCard` thumbnail grows into the `ProjectDetail` hero on open and collapses back on close.

- **Mechanism:** the native View Transitions API (`document.startViewTransition`), feature-detected. No animation library — zero runtime deps is unchanged.
- **Shared name:** `view-transition-name: detail-hero`. The clicked card's thumbnail wrapper carries it in the old state; the detail hero carries it in the new state. Exactly one element per snapshot, so a fixed name needs no per-item bookkeeping.
- **Timing:** the morph duration/easing reuse the tokens above (`--duration-slow` / `--ease-standard`) via `::view-transition-group(old|new)(detail-hero)` rules in `src/styles/index.css`.
- **Coordination:** `ReactDOM.flushSync` inside the transition callback forces React to commit (and the dialog's callback ref to call `showModal()`) before the new-state snapshot, so the `<dialog>` is in the top layer when it's captured.
- **Fallback:** no `startViewTransition`, or `prefers-reduced-motion: reduce` → instant open/close (the previous behavior). A reduced-motion rule on the transition pseudos is a belt-and-suspenders guard.
- **A11y preserved:** the native `<dialog>` still owns the focus trap, Esc (`onCancel`, `preventDefault`-ed so the transition drives the exit), click-outside, and body scroll lock. Focus returns to the opener card on close via an explicit restore (the dialog is unmounted, not `.close()`'d).

## 7. Accessibility rules

- Text contrast ≥ 4.5:1. `ink` (~5.1:1) passes on `surface` for headings and body; `ink-muted` (~12.1:1) passes. `accent`/`accent-strong` (~12.1:1) pass; `accent-strong` is used for body-size accent text by convention. `accent-ink` (~12.1:1 on the accent) covers text on accent-colored fills.
- Text on dark fills (`accent`, `line`-as-fill, `surface-raised`) uses the `surface` family (`accent-ink`, `text-surface`, `text-surface/70`) — `ink` red on a dark fill is ~2.4:1 and never used there.
- `:focus-visible` ring: 2px `accent`, 2px offset, on every interactive element.
- Modal: `role="dialog"` `aria-modal`, labelled by project title, focus trapped/restored.
- All images require `alt`; decorative glyphs `aria-hidden`.
- State communicated via `aria-pressed` + underline/weight, not color alone.
- Hit targets ≥ 44×44px on touch.

## 8. Change runbook

| Client request                      | Edit                                                            | Size             |
| ----------------------------------- | --------------------------------------------------------------- | ---------------- |
| "Different accent color"            | `--color-accent` + re-derive `--color-accent-strong` (≥4.5:1 on `surface`) and `--color-accent-ink` (≥4.5:1 on `accent`) | 2–3 lines        |
| "Whole palette too dark/light"      | The 8 color tokens in §2                                        | 8 lines          |
| "Headings bigger / smaller"         | `--text-display`, `--text-h2`                                   | 1–2 lines        |
| "More / less white space"           | `--spacing-section`                                             | 1 line           |
| "Site feels too narrow / wide"      | `--container-site`                                              | 1 line           |
| "Rounder / sharper cards"           | `--radius-card`                                                 | 1 line          |
| "Softer / sharper stage blur"       | `--blur-modal`                                                  | 1 line          |
| "Snappier / smoother animations"    | `--duration-fast`, `--duration-slow`                            | 2 lines          |
| "Card morph faster / slower"        | `--duration-slow` (the `::view-transition-*(detail-hero)` duration in `index.css`) | 1 line           |
| "Different heading font"            | ① drop woff2 in `public/fonts/` ② swap `@font-face` in `index.css` ③ update `--font-display` | 3 steps, 2 files |
