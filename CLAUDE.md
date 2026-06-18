# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual (PT-BR/EN) portfolio one-pager for a multidisciplinary designer. Vite + React 19 + Tailwind CSS v4. **Spec-driven:** the documents in `docs/` (01-product-spec → 06-behance-import) are the source of truth for scope, architecture, design, and content schemas — read the relevant doc before implementing, and update it if implementation must deviate (see the deviations section of any report in `docs/reports/` for the expected format).

## Commands

```bash
npm run dev           # Vite dev server
npm run build         # production build (budget: <150 kB gzip JS)
npm run lint          # ESLint (flat config)
npm run format        # Prettier (no semicolons, single quotes, width 100)
npm run check:tokens  # token enforcement — must pass before any commit
npm run test          # Vitest, app/src single run (jsdom env, vite.config.js)
npm run test:watch    # Vitest, watch mode
npm run test:scripts  # Vitest for scripts/lib/*.test.mjs (node env, vitest.scripts.config.js)
npm run test:e2e      # Playwright rendering battery vs `vite dev` (scripts/e2e-render.mjs)
npx vitest run src/App.test.jsx        # single test file
npx vitest run -t "renders the hero"   # single test by name
npm run og:image      # regenerate og-image.png / apple-touch-icon.png from SVG (needs rsvg-convert)
```

All of `lint`, `check:tokens`, `test`, `test:scripts`, `build` must pass before considering work done. Run `test:e2e` too after any data/loader/component change — it catches dev-only rendering breaks (e.g. a URL-unsafe content filename 404ing the eager-glob fetch) that `test`/`build` miss because they bundle the content JSON instead of serving it.

**Two vitest configs:** `vite.config.js` (jsdom env, excludes `scripts/**`, loads `src/test/setup.js`) and `vitest.scripts.config.js` (node env, no jsdom, for the Behance import unit tests in `scripts/lib/`). They run separately — `test` does not cover script tests.

## Required process: report per roadmap step

Every completed roadmap step (`docs/05-roadmap.md`) **must** produce a report at `docs/reports/YYYY-MM-DD-<step-name>.md`, linked from the README doc index. Follow the structure of `docs/reports/2026-06-11-scaffolding.md`: what was delivered, verification results, deviations from spec (with docs synced), issues found & fixed, decisions of record, next steps.

## Architecture constraints (the non-obvious ones)

- **Tokens or nothing.** Every visual value (color, type size, spacing, radius, motion) is a token in `src/styles/theme.css` — the only file edited for design changes (runbook: `docs/03-design-system.md` §8). Components use semantic utilities only (`bg-surface`, `text-display`, `max-w-site`, `gap-grid`); hex colors, arbitrary values (`text-[17px]`), and raw palette classes (`text-zinc-500`) are forbidden in `src/` and enforced by `scripts/check-tokens.mjs`.
- **Zero runtime deps beyond react/react-dom.** No router (URL hash for filter state), no i18n library (small context + JSON dictionaries), no state/animation libraries. Adding a runtime dependency is a spec change, not an implementation detail.
- **Content flows through one seam.** Components never import JSON; all project data goes through `src/lib/projects.js` (validates against schemas in `docs/04-content-model.md`). This module is the v2 swap point for the future admin UI — don't let data access leak elsewhere. `getProjects()`/`getProfile()` return the real scraped data (15 projects); tests derive counts/names/providers from these functions rather than hardcoding.
- **Some content fields are optional.** `project.description` may be `{ pt: '', en: '' }` and `profile.email` may be `''` (Behance exposes neither) — components render nothing / an empty `mailto:` and must not require them. `project.category` must be one of `video`, `motion`, `product`, `graphic` (`CATEGORIES` in `projects.js`); video providers are `youtube`, `vimeo`, `adobe-ccv` (`VIDEO_PROVIDERS`), where adobe-ccv's `videoId` is the full Behance embed URL used directly as the iframe `src`.
- **Layout composes `Section > Container`** (`src/components/layout/`) — sections never apply their own rhythm or max-width.
- **Bilingual by schema.** Content fields are `{ pt, en }` pairs (both required); UI strings come from `src/i18n/` dictionaries via `useI18n()` (`t()` for UI keys, `pick()` for content fields). No hardcoded user-visible copy in components. The pt/en dictionaries must have identical key sets — test-enforced.
- **Tests run without injected globals** — import `describe/it/expect` from `vitest`; Testing Library cleanup is registered explicitly in `src/test/setup.js`. The `test` scripts set `NODE_OPTIONS=--no-experimental-webstorage` because Node 26's experimental global `localStorage` shadows jsdom's; always use `window.localStorage` (never bare `localStorage`) in source and tests.

## Behance import tooling

`scripts/fetch-behance.mjs` (+ `scripts/lib/behance-*.mjs`) scrapes a Behance profile into portfolio data — full spec in `docs/06-behance-import.md`. It is a **dev-only** tool: `playwright` and `sharp` are devDependencies, never imported by `src/`, so the zero-runtime-deps rule still holds.

```bash
node scripts/fetch-behance.mjs --profile https://www.behance.net/joaokalaf
```

- Playwright (headless Chromium) scrapes profile + project pages; data comes from the `be-state` script tag first, then network interception, then DOM.
- Images download and convert to WebP via sharp (16:10 thumbnails, gallery max-1600px). Non-source-language fields get a `TRANSLATE:` prefix for grep-able human review.
- Category mapping uses tag heuristics in `behance-map.mjs`, defaulting to `graphic`. `CATEGORIES` is inlined there (not imported) to dodge Node 26's `ERR_IMPORT_ATTRIBUTE_MISSING` for JSON imports.
- Output stages to `scripts/scripts/behance-dump/`, then is manually copied into `src/data/`.

## Deployment

Vercel auto-deploys from `main` (no GitHub Actions; no `base` path in `vite.config.js`). The old `gh-pages` branch is deprecated — do not use it.

## Pending client input

Real name/brand, bio, accent color, and font approval are pending (checklist in `README.md`). Current values in `theme.css` marked "pending client approval" are placeholders — keep them swappable, don't bake them in. `profile.email` is currently empty (Behance doesn't expose it) and needs manual entry.
