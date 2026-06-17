# 2026-06-17 — Content restructure behind the seam (v2 Step 1)

Roadmap: [05 — v2 Step 1](../05-roadmap.md). First implementation step of the Decap/admin work — moves content storage to the per-file `content/` layout without changing the public site's behavior. Also lands the fresh high-res Behance dump as the live content.

## Delivered

- **Per-file content layout.** Single `src/data/projects.json` array → one file per project at `content/projects/<slug>.json` (15 files); `src/data/profile.json` → `content/profile.json`. `src/data/` removed.
- **Loader swap (seam internals only).** `src/lib/projects.js` now imports projects via `import.meta.glob('../../content/projects/*.json', { eager: true })` and profile via a relative import. The pure validators (`loadProjects`/`loadProfile`), `getProjects`/`getProfile`/`getProjectsByCategory`, and every component are untouched.
- **Importer emits per-file.** `scripts/lib/behance-write.mjs` writes `<outputDir>/projects/<slug>.json` per project (+ new `projectFilename` helper) so future dumps produce the `content/` structure directly. The fetch "next steps" log points at `content/`.
- **Fresh high-res content.** The re-dumped data (gallery masters median ~1920px, intrinsic `width`/`height` recorded — see the image-pipeline fix below) was split into `content/` and its 96 WebP images copied to `public/images/projects/`.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | pass |
| `npm run check:tokens` | pass |
| `npm run test` | 58 pass (5 files) — incl. `getProjects()`/`getProfile()` seed-data integration against the glob source |
| `npm run test:scripts` | 109 pass (4 files) — incl. new `projectFilename` test |
| `npm run build` | pass — **71.24 kB gzip JS** (budget < 150 kB); glob resolves in production |

Category coverage in the new data: graphic 10, video 2, product 2, motion 1 — satisfies the "≥1 per category" assertion.

## Deviations from spec

None. Matches `docs/02 §2-3` (content/ layout, synchronous glob seam) and `docs/04` (per-file storage). No doc edits required.

## Issues found & fixed

- **Dump shipped 600px images** despite the high-res changes. Root cause: Behance `be-state` keeps downloadable, width-tagged URLs in `imageSizes.allAvailable[]`; the named `size_*` keys are unreliable (`size_1400` is `null`, `size_max_1200` has no `url`). `extractBestImageUrl` (scripts/lib/behance-scrape.mjs) was rewritten to scan `allAvailable` + named entries and pick the widest. Verified over the raw dump: median selected width 600 → 1920 (max 7815, capped at 2560).

## Decisions of record

- **Content lives at repo root `content/`** (Tina/Decap convention) rather than `src/data/`. The seam absorbs the move; tests confirm no component impact.
- **Files named `<slug>.json`** — aligns with the planned Decap `folder` collection filename pattern (`docs/07`).
- **`import.meta.glob` (eager)** chosen over a generated manifest: zero build tooling, works in vitest, and the validators still run on load.

## Next steps

- **Step 2 — Responsive image system** (`docs/08`): shared sharp ladder module + `src/lib/images.js` + `Picture` component; convert `ProjectCard`/`ProjectDetail`; build-time generation of the AVIF/WebP ladder from the committed masters.
- Then Step 3 (Decap UI) → Step 4 (OAuth proxy) → Step 5 (wiring + validation test + final report).
