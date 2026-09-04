# Report — Design system refresh: Blood Red & Black (client palette + fonts)

**Date:** 2026-09-03
**Scope:** [Design doc §2/§3](../03-design-system.md) — apply the client's new palette from the color table in `03-design-system.md` (PR #12: white surface, blood-red ink, black chrome) and the Neue Montreal / DM Sans font swap, plus sync the doc's descriptions (title, principles, contrast claims, component notes, a11y numbers) to the new values. No roadmap step; client-driven design change on `dev/8-card-detail-transition`.
**Status:** ✅ Complete. All six checks green.

## 1. What was delivered

| Area | Delivered |
| --- | --- |
| Palette swap | `theme.css` color block set to the client table: `surface #fff5f5`, `surface-raised #333132`, `ink #d60302`, `ink-muted/line/accent/accent-strong/overlay #333132`. Components untouched on the home page — semantic utilities re-resolve automatically. |
| `accent-ink` re-derived | The table's literal `accent-ink` value (`#333132`) **equals the accent fill itself** → text on accent backgrounds (CTAs, `::selection`, skip-link) would be invisible. Re-derived to `#fff5f5` (surface white, 12.1:1 on the accent) per the doc's own "re-derive the pair when the accent changes" convention. Flagged to the client. |
| Detail stage on-colors | The charcoal `surface-raised/90` frosted panel (client's "Cards, modal") makes `ink` (red, 2.4:1) and `ink-muted`/`line` (same value as the panel) unreadable. `ProjectDetail` internals flipped to light on-dark tokens: `text-surface`, `text-surface/70`, `border-surface/25`. Same flip for the `ProjectCard` video badge (`text-surface`). |
| LanguageToggle | Active pill `bg-line text-ink` (red-on-charcoal, 2.4:1) → `bg-accent text-accent-ink` (the documented on-fill pair; renders the same black pill + white text). |
| Fonts | Rubik/Inter files removed from `public/fonts/`. Neue Montreal as static OTFs (Regular/Medium/Bold, from `Neue Montreal.zip` in repo root) + DM Sans variable woff2 (fontsource, latin). `@font-face` rewritten in `index.css`, `--font-display`/`--font-sans` updated, preloads swapped in `index.html` (DM Sans + Neue Montreal Regular). |
| Brand assets | `favicon.svg` → blood red; `og-image.svg` → token-mirrored palette (surface bg, red name, black accent bar, `#333132` text) and font family names updated; both PNGs regenerated via `npm run og:image`; `theme-color` stale orange `#E8590C` → `#fff5f5`. |
| Doc sync (`03-design-system.md`) | Title/intro/principles rewritten for the light palette; §2 contrast column re-computed (red ink 5.1:1, black chrome 12.1:1 — the old ~16:1/~9:1 claims were stale); §5 "dark-mode deltas" → "palette-dependent behavior" incl. the inverted on-colors; §7 a11y numbers fixed; §8 accent row now mandates re-deriving `accent-ink` too; added dark-fill inversion rule; removed the dangling "Apply it — exact file edits" stub (empty since the doc's first commit). |
| Report | This file. |

## 2. Verification results

| Check | Result |
| --- | --- |
| `npm run lint` | ✅ clean |
| `npm run check:tokens` | ✅ clean — no raw values outside `theme.css` (opacity utilities like `text-surface/70` are token-based, same pattern as `bg-surface-raised/90`) |
| `npm run test` | ✅ 75/75 |
| `npm run test:scripts` | ✅ 113/113 |
| `npm run test:e2e` | ✅ 8/8 (run inside `nix develop`; outside it the Playwright-cached Chromium can't load `libglib-2.0` — flake documents this coupling) |
| `npm run build` | ✅ JS 72.12 kB gzip, CSS 5.54 kB gzip — budget <150 kB intact |
| Contrast (computed) | ink 5.07:1, ink-muted/accent/line 12.07:1 on `#fff5f5`; `accent-ink`/`text-surface` 12.07:1 on `#333132`; `text-surface/70` ≈7:1 on the stage panel |
| Old-palette grep | ✅ no `Rubik`/`Inter`/green-era hex/leftover orange in `src/`, `index.html`, `public/*.svg`, active docs |

## 3. Deviations from the client table — ✅ accepted by client (2026-09-03)

1. **`--color-accent-ink`: `#333132` → `#fff5f5` (derived).** The table value equaled the accent fill itself — every accent-background text (two CTAs, skip-link, `::selection`) would render invisible. The doc's §2/§8 convention already required re-deriving on-accent colors on an accent change. If the designer wants different values, it's a 1-line edit in `theme.css`.
2. **Dark-fill text tokens.** Text on `surface-raised`/`accent` fills now uses `surface`-family tokens (`text-surface`, `text-surface/70`, `border-surface/25`) — red `ink` on charcoal is 2.4:1. Affects `ProjectDetail`, the `ProjectCard` video badge, and `LanguageToggle`'s active pill (`bg-accent text-accent-ink`). All still semantic utilities — no raw values introduced.
3. **Accent pair collapsed to one value.** `accent` == `accent-strong` (`#333132`) per the table, so `hover:bg-accent-strong` on CTAs is visually a no-op and card-title hover now reads as red→black. No third color was invented; noted in §2 prose until the palette differentiates the pair again.

## 4. Notes

- `Neue Montreal.zip` remains untracked at the repo root as the font source of record; only Regular/Medium/Bold OTFs are served (~40 KB each, `font-display: swap`). Italic faces were not extracted (nothing in the UI uses italics). If the client approves, the zip should be either committed as the source of record or dropped once fonts are in `public/fonts/`.
- `og-image.svg` carries raw hex by design (it mirrors tokens and feeds `rsvg-convert`); `check:tokens` only scans `src/`, unchanged.
- `docs/agents/`, the modified `CLAUDE.md`, and `Neue Montreal.zip` were pre-existing untracked changes — not touched here.