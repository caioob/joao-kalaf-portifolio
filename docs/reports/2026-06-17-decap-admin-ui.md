# 2026-06-17 — Decap admin UI (v2 Step 3)

Roadmap: [05 — v2 Step 3](../05-roadmap.md). Spec: [07 — Admin CMS](../07-admin-cms.md). Stands up the local Decap editor and the schema mapping; production GitHub-OAuth auth is Step 4.

## Delivered

- **`public/admin/decap-cms.js`** — vendored, pinned Decap bundle (`decap-cms` 3.14.1, ~4.8 MB), committed. No runtime CDN; a separate static app, never imported by `src/`, so the public bundle and its budget are untouched.
- **`public/admin/index.html`** — loads the bundle (auto-inits + auto-loads `config.yml`), `robots: noindex`.
- **`public/admin/config.yml`** — maps the content model (doc 04) to Decap widgets:
  - `projects` folder collection (`content/projects/*.json`, `format: json`, filename `{{fields.slug}}`); `category`/`provider` as `select`, `date`/`slug` `pattern`-validated, `{pt,en}` as object widgets, **`media` as a `types` list** (image/video) — Decap's default `type` discriminator key matches the schema exactly.
  - `profile` single-file collection.
  - `local_backend: true` + `media_folder` wired to the existing image dir.
- **`eslint.config.js`** — ignores `public/admin` (the minified vendored bundle).

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` / `check:tokens` | pass (bundle ignored) |
| `npm run test` / `test:scripts` | 65 / 113 pass |
| `npm run test:e2e` | 8/8 — public site unaffected by the admin |
| `npm run build` | pass; `dist/admin/` ships `index.html` + `config.yml` + `decap-cms.js` |
| **Decap loads (browser)** | via `npx decap-server` + static serve: config parses (no error), local-backend login succeeds, **Projects + Profile collections render with all 15 entries**, 0 page errors |

## Issues found & fixed

- **Wrong package first.** Vendored `decap-cms-app` (needs a manual `CMS.init()`) → mounted with a React-internals error and a blank CMS. Switched to **`decap-cms`** (auto-initializing) → mounts cleanly. Doc 07 corrected.
- **Bare `/admin/` in dev** serves the React app (Vite SPA history-fallback). Use **`/admin/index.html`** locally; Vercel resolves `/admin/` → `index.html` automatically. Documented in doc 07.

## Decisions of record

- **Commit the vendored bundle** (vs runtime CDN or build-time download): truly self-hosted, no build/runtime network dependency — consistent with the self-hosted-OAuth choice. Cost: ~4.8 MB in git (proportionate to the already image-heavy repo).
- `slug` field carries the same `^[A-Za-z0-9-]+$` pattern enforced after the dev-rendering bug, so the CMS can't create a URL-unsafe filename.

## Limitations / next steps

- **Step 4 — GitHub OAuth proxy** (`api/`), so the client logs in on the live site (config already points `base_url`/`auth_endpoint` at it).
- **Step 5 — upload→optimize wiring:** Decap image uploads land as raw masters; the build generator (doc 08) must produce their WebP ladder, and non-WebP uploads need handling (`variantSrc` assumes `.webp`).
- `id` is a manual field (no auto-increment); revisit in Step 5.
