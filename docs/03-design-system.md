# 03 — Design System

Direction: **light & minimal** — generous white space, warm neutral palette, editorial typography. The interface recedes; thumbnails and video are the color. One accent color used sparingly (links, active filter, focus).

**The system is fully token-driven.** Every visual value in this document is a named token living in a single file, `src/styles/theme.css` (Tailwind v4 `@theme`). When the client requests a design change, the edit happens there and nowhere else — see the [change runbook (§8)](#8-change-runbook).

## 1. Principles

1. **Work first.** The grid is the protagonist; chrome is quiet.
2. **One accent.** If something doesn't need the accent color, it's neutral.
3. **Type does the branding.** No logos or decorative graphics in v1 — a strong display face and confident scale carry identity.
4. **Calm motion.** Animation confirms interaction, never decorates ([§6](#6-motion)).
5. **Tokens or nothing (hard rule).** Components may only use semantic token utilities (`bg-surface`, `text-display`, `rounded-card`…). Raw palette classes (`text-zinc-500`), arbitrary values (`text-[17px]`, `mt-[96px]`), and literal colors are forbidden outside `theme.css`. Enforced by a CI check ([architecture §6](02-architecture.md)).

## 2. Color tokens

These names become utilities (`bg-surface`, `text-ink`, `border-line`, …).

| Token                    | Value                                                  | Usage                                           |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| `--color-surface`        | `#FAFAF8` (warm off-white)                             | Page background                                 |
| `--color-surface-raised` | `#FFFFFF`                                              | Cards, modal                                    |
| `--color-ink`            | `#1C1B1A` (near-black, warm)                           | Headings, body                                  |
| `--color-ink-muted`      | `#6E6A66`                                              | Secondary text, captions (4.5:1 on surface ✓)   |
| `--color-line`           | `#E8E5E1`                                              | Hairline borders, dividers                      |
| `--color-accent`         | `#E8590C` (burnt orange) **— pending client approval** | Large text, icons, hover, focus ring            |
| `--color-accent-strong`  | `#C2410C` (darkened accent)                            | Body-size accent text — passes 4.5:1 on surface |
| `--color-accent-ink`     | `#FFFFFF`                                              | Text on accent backgrounds                      |

`accent` and `accent-strong` form a pair: whenever the accent changes, re-derive `accent-strong` so it keeps ≥ 4.5:1 contrast on `surface` (check with any contrast tool). No other hex value may appear anywhere in the codebase.

Category chips use `ink-muted` text on `line`-tinted backgrounds — categories are _not_ color-coded (four extra colors would fight the minimal direction).

## 3. Typography

| Token            | Face                 | Notes                                                                                             |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `--font-display` | **Rubik**            | Geometric sans with rounded warmth. **Pending client approval** — self-hosted `Rubik-Regular.ttf` |
| `--font-sans`    | **Inter** (variable) | UI & body                                                                                         |

Components reference `font-display` / `font-sans` only — never a face name. Both fonts are self-hosted (`@font-face` in `src/styles/index.css`, `font-display: swap`) — no CDN request (performance + privacy). Inter ships as woff2; Rubik is currently a static `.ttf` pending approval (convert to woff2 when locked). Swapping a font is a 3-step runbook entry (§8).

Type scale — defined as `@theme` text tokens with `clamp()` (fluid desktop→mobile), each bundling size + line-height + tracking. Components use the utility (`text-display`), never raw sizes:

| Token            | Value                                             | Use                          |
| ---------------- | ------------------------------------------------- | ---------------------------- |
| `--text-display` | `clamp(2.5rem, 6vw, 4rem)`, lh 1.05, tracking −1% | Hero name                    |
| `--text-h2`      | `clamp(1.75rem, 4vw, 2.25rem)`, lh 1.15           | Section titles               |
| `--text-h3`      | `clamp(1.19rem, 2vw, 1.375rem)`, lh 1.3           | Card/modal titles            |
| `--text-body`    | `1.0625rem` (17px), lh 1.6                        | Paragraphs, max-width `65ch` |
| `--text-small`   | `0.875rem` (14px), lh 1.45                        | Chips, captions, footer      |

## 4. Layout, spacing, grid

Layout tokens:

| Token               | Value                                                                                            | Usage                                               |
| ------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `--container-site`  | `75rem` (1200px)                                                                                 | Content max-width (`max-w-site`)                    |
| `--container-modal` | `55rem` (880px)                                                                                  | Project detail modal width (`max-w-modal`)          |
| `--spacing-section` | `clamp(2rem, 5vw, 3rem)` (32→48px **per side** of each `Section`, i.e. 64→96px between sections) | Vertical rhythm                                     |
| `--spacing-grid`    | `1.5rem` (24px)                                                                                  | Work grid gap (`gap-grid`)                          |
| `--radius-card`     | `0.75rem`                                                                                        | Cards, modal, thumbnails                            |
| `--aspect-thumb`    | `16 / 10`                                                                                        | Project thumbnails (`aspect-thumb`, `object-cover`) |

These flow through **two shared layout primitives** — the only components allowed to consume them directly:

- `Container` — max-width `--container-site`, padding 24px mobile / 48px ≥ `md`.
- `Section` — applies `--spacing-section` rhythm + the scroll-reveal motion (§6).

Every page section composes `Section > Container`, so "more/less breathing room" or "wider/narrower site" is a one-token edit.

- **Spacing inside components:** Tailwind's default 4px scale; snap to multiples of 8.
- **Work grid:** CSS grid — 1 column < 640px, 2 ≥ `sm`, 3 ≥ `lg`, gap `--spacing-grid`.
- **Breakpoints:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).

## 5. Component inventory

States to design/build for every interactive component: default · hover · focus-visible · active · (disabled/empty where relevant).

| Component        | Description & key states                                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Navbar`         | Sticky, translucent surface + blur, hairline bottom border appears on scroll. Anchor links + `LanguageToggle`. Collapses to compact row on mobile (4 links fit — no hamburger).                                                                                       |
| `LanguageToggle` | Two-segment control `PT / EN`; active segment ink-on-line, inactive muted. `aria-pressed`.                                                                                                                                                                            |
| `Hero`           | Name in `text-display font-display`; role list as one muted line ("Video · Motion · Product · Graphic"); short tagline; accent CTA → `#work`.                                                                                                                         |
| `FilterBar`      | Horizontal pill row: All + 4 categories. Active pill = accent-strong text + accent hairline underline; inactive = muted. Scrollable on mobile with fade hint. `aria-pressed` per pill.                                                                                |
| `ProjectCard`    | Thumbnail (`aspect-thumb`), title (`text-h3`), category chip, year. Hover: thumbnail scales 1.02 inside clipped frame, title gains accent-strong. Entire card is one `<button>`/link. Video projects show a small play glyph on the thumbnail.                        |
| `ProjectDetail`  | Modal: raised surface, max-width `--container-modal`, scrollable body. Title, meta row (category · year · tools), description, media gallery (images + lazy video embeds 16:9), external links. Focus trap, `Esc`/overlay/✕ close, focus returns to the opening card. |
| `ServiceList`    | The four disciplines as a 2×2 (mobile 1-col) list: name + one-line description each. Text only, numbered `01–04` in muted `font-display`.                                                                                                                             |
| `ContactSection` | Big editorial invitation line + accent `mailto:` button + social links row.                                                                                                                                                                                           |
| `Footer`         | Small: copyright, repeat of `LanguageToggle`.                                                                                                                                                                                                                         |
| Empty state      | Muted message + "show all" link when a filter has no projects.                                                                                                                                                                                                        |

## 6. Motion

Motion tokens:

| Token             | Value                                   | Usage                           |
| ----------------- | --------------------------------------- | ------------------------------- |
| `--duration-fast` | `150ms`                                 | Hover, focus, color changes     |
| `--duration-slow` | `250ms`                                 | Modal enter/exit, scroll reveal |
| `--ease-standard` | `cubic-bezier(0, 0, 0.2, 1)` (ease-out) | All transitions                 |

- Allowed properties: opacity, transform (scale/translate ≤ 8px), color. **Never** animate layout properties.
- One signature touch: sections fade-and-rise 12px on first scroll into view (IntersectionObserver, once — lives in `Section`).
- `@media (prefers-reduced-motion: reduce)`: all transitions/animations effectively disabled (duration 0); modal still works, content never depends on animation.

## 7. Accessibility rules

- Text contrast ≥ 4.5:1. `accent` (`#E8590C`) on `surface` ≈ 4.0:1 — body-size accent text must use `accent-strong` instead; `accent` itself is reserved for large text (≥ 24px), icons, and decorative emphasis.
- `:focus-visible` ring: 2px `accent`, 2px offset, on every interactive element.
- Modal: `role="dialog"` `aria-modal`, labelled by project title, focus trapped and restored.
- All images require `alt` (enforced by content schema); decorative glyphs `aria-hidden`.
- Filter and toggle communicate state via `aria-pressed`, not color alone (underline/weight also change).
- Hit targets ≥ 44×44px on touch.

## 8. Change runbook

Every plausible client request maps to a small, predictable edit. Unless noted, the only file touched is `src/styles/theme.css`.

| Client request                      | Edit                                                                                                                            | Size             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| "Different accent color"            | `--color-accent` + re-derive `--color-accent-strong` (contrast-check on `surface`)                                              | 2 lines          |
| "Whole palette feels too warm/cold" | The 8 color tokens in §2                                                                                                        | 8 lines          |
| "Headings bigger / smaller"         | `--text-display`, `--text-h2`                                                                                                   | 1–2 lines        |
| "More / less white space"           | `--spacing-section`                                                                                                             | 1 line           |
| "Site feels too narrow / wide"      | `--container-site`                                                                                                              | 1 line           |
| "Rounder / sharper cards"           | `--radius-card`                                                                                                                 | 1 line           |
| "Different thumbnail shape"         | `--aspect-thumb` (re-crop images to match)                                                                                      | 1 line + assets  |
| "Snappier / smoother animations"    | `--duration-fast`, `--duration-slow`                                                                                            | 2 lines          |
| "Different heading font"            | ① drop woff2 in `public/fonts/` ② swap the `@font-face` block in `src/styles/index.css` ③ update `--font-display` stack         | 3 steps, 2 files |
| "Dark mode"                         | Out of v1 scope, but the semantic tokens make it a `@media`/class-based re-mapping of the 8 color tokens — no component changes |

Anything _not_ achievable this way (new sections, layout restructuring) is a feature request, not a design tweak — it goes through the normal spec process.
