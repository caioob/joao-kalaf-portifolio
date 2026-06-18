# AGENTS.md

Quick-reference for working in this repo. For full context, read `CLAUDE.md` and the spec docs in `docs/`.

## Verification (run in this order)

```bash
npm run lint && npm run check:tokens && npm run test && npm run test:scripts && npm run build
```

All five must pass. Build budget: < 150 kB gzip JS.

Run `npm run test:e2e` after any data/loader/component change — it catches dev-only rendering breaks (e.g. URL-unsafe content filename 404ing the eager-glob fetch) that `test`/`build` miss because they bundle the content JSON instead of serving it.

## Build pipeline

`npm run build` runs `generate-images.mjs && vite build`. The image script reads canonical WebP masters from content, writes responsive variants to `public/images/projects/` (idempotent — existing variants skipped). Variant widths come from `src/lib/images.js`, shared with the frontend `srcset` — a card never references a variant the generator didn't write.

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
- **Two vitest configs:** `vite.config.js` (main, jsdom env, excludes `scripts/**`) and `vitest.scripts.config.js` (node env, no jsdom setup, for `scripts/lib/*.test.mjs`). Run script tests with `npm run test:scripts`.
- **App tests use dynamic data:** `getProjects()`/`getProfile()` return real scraped data (15 projects, empty email, adobe-ccv videos). Don't hardcode project names, counts, or video providers in tests — derive them from the data functions.

## Architecture constraints that bite

- **Zero runtime deps beyond react/react-dom.** No router (filter state = URL hash), no i18n lib, no animation lib. Adding a dep is a spec change, not an implementation detail. Decap CMS is served as static assets under `public/admin/` — never imported by `src/` — so the rule holds. ESLint ignores `public/admin` (`eslint.config.js`).
- **Content lives in `content/`** (not `src/data/`). One JSON file per project in `content/projects/`, plus `content/profile.json`. Components never import JSON directly — all data flows through `src/lib/projects.js` (validates + sorts). This is the v2 admin swap point.
- **Layout:** sections compose `Section > Container` from `src/components/layout/`. Sections never set their own max-width or vertical rhythm.
- **i18n:** content fields are `{ pt, en }` pairs; UI strings via `useI18n()` (`t()` for keys, `pick()` for content). No hardcoded user-visible strings. `en.json` and `pt.json` must have identical key sets (test-enforced).
- **Spec-driven:** `docs/01–08` are source of truth. Read the relevant doc before implementing. Deviations must update docs and be noted in `docs/reports/`.
- **Responsive images (docs/08):** `src/lib/images.js` defines ladder widths and `srcSetFor()` — shared between frontend and `scripts/generate-images.mjs`. WebP-only by decision.

## Data model — what's optional

- **`project.description`**: may be `{ pt: "", en: "" }` — Behance projects often lack descriptions. The component renders nothing when empty. Don't make it required.
- **`profile.email`**: may be `""` — Behance doesn't expose email. The contact CTA renders `mailto:` with no address. Don't make it required.
- **`project.category`**: must be one of `video`, `motion`, `product`, `graphic`. The Behance import maps via tag heuristics and defaults to `graphic` when unmatched.

## Video providers

Three providers supported in `VIDEO_PROVIDERS` (`src/lib/projects.js`):

| Provider | `videoId` format | Embed |
|---|---|---|
| `youtube` | YouTube video ID | `youtube.com/embed/{videoId}` |
| `vimeo` | Vimeo video ID | `player.vimeo.com/video/{videoId}` |
| `adobe-ccv` | Full embed URL from Behance | iframe `src` = `videoId` directly |

Adobe CCV is used by Behance video modules. The `videoId` is the full URL (e.g. `https://www-ccv.adobe.io/v1/player/ccv/.../embed?api_key=behance1&...`).

## Behance import script

See `docs/06-behance-import.md` for the full spec. Quick reference:

```bash
node scripts/fetch-behance.mjs --profile https://www.behance.net/joaokalaf
```

- Uses Playwright (headless Chromium) to scrape Behance profile + project pages
- Extracts data from `be-state` script tag (primary), network interception (fallback), DOM (last resort)
- Downloads images, converts to WebP via sharp (16:10 thumbnails, max-1600px gallery)
- Non-source language fields get `TRANSLATE:` prefix (grep-friendly for human review)
- Category mapping via tag heuristics (`behance-map.mjs`), defaults to `graphic`
- Output stages to `scripts/scripts/behance-dump/`, then manually copied into `content/`
- `CATEGORIES` is inlined in `behance-map.mjs` to avoid Node 26 `ERR_IMPORT_ATTRIBUTE_MISSING` with JSON imports
- Real Behance data shapes: `beState.profile.user` (not `beState.user`), `raw.project.project` (double-nested), module types are `ImageModule`/`VideoModule`/`TextModule` (not lowercase), covers at `covers.size_original_webp.url` or `covers.allAvailable[]`

## Local dev with Decap

`npm run dev-local` runs `npm run dev` (Vite) and `npx decap-server` concurrently. Open `/admin/index.html` (not `/admin/` — the SPA fallback serves the React app for the bare path). `config.yml` has `local_backend: true` so Decap connects to the local backend on port 8081 with no GitHub round-trip.

## Deployment

- **Vercel** auto-deploys from `main` branch. No GitHub Actions workflows.
- GitHub Pages (`gh-pages` branch) is deprecated — do not use.
- No `base` path in vite.config.js (Vercel serves from root).

## Style

- Prettier: no semicolons, single quotes, printWidth 100.
- ESLint: unused-vars ignores `^[A-Z_]` pattern.
- No comments in source unless explicitly requested.

## Reports

Every completed roadmap step (`docs/05-roadmap.md`) requires a report at `docs/reports/YYYY-MM-DD-<step-name>.md`. Follow the template in `docs/reports/2026-06-11-scaffolding.md`.

## Pending client input

Name, bio, projects, accent color, and font are placeholders (marked in `theme.css`). Keep them swappable — don't bake in.
Email is currently empty (Behance doesn't expose it) — needs manual entry.
