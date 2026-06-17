# AGENTS.md

Quick-reference for working in this repo. For full context, read `CLAUDE.md` and the spec docs in `docs/`.

## Verification (run in this order)

```bash
npm run lint && npm run check:tokens && npm run test && npm run build
```

All four must pass. Build budget: < 150 kB gzip JS.

## Token enforcement — the #1 thing you'll forget

`npm run check:tokens` scans `src/` and rejects any file (except `src/styles/theme.css`) containing:

- hex color literals (`#fff`, `#1a1a1a`)
- arbitrary-value utilities (`text-[17px]`, `bg-[#333]`)
- raw Tailwind palette classes (`text-zinc-500`, `bg-slate-100`)

Only `src/styles/theme.css` may define visual values. Components must use semantic utilities (`bg-surface`, `text-display`, `max-w-site`, `gap-grid`). Edit tokens, not components.

## Test gotchas

- Test scripts set `NODE_OPTIONS=--no-experimental-webstorage` — Node 26's experimental global `localStorage` shadows jsdom's. Always use `window.localStorage` in source and tests.
- Import `describe`/`it`/`expect` from `vitest` explicitly — no injected globals.
- Testing Library cleanup is manual: `afterEach(cleanup)` in `src/test/setup.js`.
- `setup.js` also mocks `IntersectionObserver` (reports everything in-view), `matchMedia`, `<dialog>.showModal/close`, and creates `<meta name="description">` — don't re-mock these.
- jsdom `url` is set to `http://localhost/` in `vite.config.js` so localStorage works.
- Single test: `npx vitest run src/App.test.jsx` or `npx vitest run -t "test name"`.

## Architecture constraints that bite

- **Zero runtime deps beyond react/react-dom.** No router (filter state = URL hash), no i18n lib, no animation lib. Adding a dep is a spec change, not an implementation detail.
- **Content seam:** components never import `src/data/*.json` directly. All data flows through `src/lib/projects.js` (validates + sorts). This is the v2 admin swap point.
- **Layout:** sections compose `Section > Container` from `src/components/layout/`. Sections never set their own max-width or vertical rhythm.
- **i18n:** content fields are `{ pt, en }` pairs; UI strings via `useI18n()` (`t()` for keys, `pick()` for content). No hardcoded user-visible strings. `en.json` and `pt.json` must have identical key sets (test-enforced).
- **Spec-driven:** `docs/01–05` are source of truth. Read the relevant doc before implementing. Deviations must update docs and be noted in `docs/reports/`.

## Style

- Prettier: no semicolons, single quotes, printWidth 100.
- ESLint: unused-vars ignores `^[A-Z_]` pattern.
- No comments in source unless explicitly requested.

## Reports

Every completed roadmap step (`docs/05-roadmap.md`) requires a report at `docs/reports/YYYY-MM-DD-<step-name>.md`. Follow the template in `docs/reports/2026-06-11-scaffolding.md`.

## Pending client input

Name, bio, projects, accent color, and font are placeholders (marked in `theme.css`). Keep them swappable — don't bake in.
