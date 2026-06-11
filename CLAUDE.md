# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual (PT-BR/EN) portfolio one-pager for a multidisciplinary designer. Vite + React 19 + Tailwind CSS v4. **Spec-driven:** the documents in `docs/` (01-product-spec → 05-roadmap) are the source of truth for scope, architecture, design, and content schemas — read the relevant doc before implementing, and update it if implementation must deviate (see the deviations section of any report in `docs/reports/` for the expected format).

## Commands

```bash
npm run dev           # Vite dev server
npm run build         # production build (budget: <150 kB gzip JS)
npm run lint          # ESLint (flat config)
npm run format        # Prettier (no semicolons, single quotes, width 100)
npm run check:tokens  # token enforcement — must pass before any commit
npm run test          # Vitest, single run
npm run test:watch    # Vitest, watch mode
npx vitest run src/App.test.jsx        # single test file
npx vitest run -t "renders the hero"   # single test by name
```

All of `lint`, `check:tokens`, `test`, `build` must pass before considering work done.

## Required process: report per roadmap step

Every completed roadmap step (`docs/05-roadmap.md`) **must** produce a report at `docs/reports/YYYY-MM-DD-<step-name>.md`, linked from the README doc index. Follow the structure of `docs/reports/2026-06-11-scaffolding.md`: what was delivered, verification results, deviations from spec (with docs synced), issues found & fixed, decisions of record, next steps.

## Architecture constraints (the non-obvious ones)

- **Tokens or nothing.** Every visual value (color, type size, spacing, radius, motion) is a token in `src/styles/theme.css` — the only file edited for design changes (runbook: `docs/03-design-system.md` §8). Components use semantic utilities only (`bg-surface`, `text-display`, `max-w-site`, `gap-grid`); hex colors, arbitrary values (`text-[17px]`), and raw palette classes (`text-zinc-500`) are forbidden in `src/` and enforced by `scripts/check-tokens.mjs`.
- **Zero runtime deps beyond react/react-dom.** No router (URL hash for filter state), no i18n library (small context + JSON dictionaries), no state/animation libraries. Adding a runtime dependency is a spec change, not an implementation detail.
- **Content flows through one seam.** Components never import JSON; all project data goes through `src/lib/projects.js` (validates against schemas in `docs/04-content-model.md`). This module is the v2 swap point for the future admin UI — don't let data access leak elsewhere.
- **Layout composes `Section > Container`** (`src/components/layout/`) — sections never apply their own rhythm or max-width.
- **Bilingual by schema.** Content fields are `{ pt, en }` pairs (both required); UI strings come from `src/i18n/` dictionaries via `useI18n()` (`t()` for UI keys, `pick()` for content fields). No hardcoded user-visible copy in components. The pt/en dictionaries must have identical key sets — test-enforced.
- **Tests run without injected globals** — import `describe/it/expect` from `vitest`; Testing Library cleanup is registered explicitly in `src/test/setup.js`. The `test` scripts set `NODE_OPTIONS=--no-experimental-webstorage` because Node 26's experimental global `localStorage` shadows jsdom's; always use `window.localStorage` (never bare `localStorage`) in source and tests.

## Pending client input

Real name/brand, bio, projects, accent color, and font approval are pending (checklist in `README.md`). Current values in `theme.css` marked "pending client approval" are placeholders — keep them swappable, don't bake them in.
