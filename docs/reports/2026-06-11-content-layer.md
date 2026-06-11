# Report — Content Layer (Roadmap v1, Step 2)

**Date:** 2026-06-11
**Scope:** [Roadmap §v1 step 2](../05-roadmap.md) — schemas, validation, repository seam, seed data per the [content model](../04-content-model.md).
**Status:** ✅ Complete. All checks green. Paused for user review before step 3 (i18n).

## 1. What was delivered

| Area          | Delivered                                                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typedefs      | `src/lib/types.js` — JSDoc-only `Project`, `LocalizedText`, `Image`, `Media` (image/video union), `Link`, `Profile`, `Service`, mirroring the content-model tables 1:1                                                                         |
| Repository    | `src/lib/projects.js` — `CATEGORIES` enum, `getProjects()` (validated, newest-first), `getProjectsByCategory()`, `getProfile()`; module-level cache; the only module importing the data JSON ([architecture §3](../02-architecture.md))        |
| Validation    | Every content-model rule: unique `id`/`slug`, category enum, `YYYY-MM` date, `{pt,en}` completeness, non-empty `media`, image `alt` required, video `provider`+`videoId` required, link/tool/social shape. Errors name the record id and field |
| Failure modes | Strict (dev) throws; non-strict (prod) skips the bad project with `console.warn` — one bad JSON edit can't blank the site. Invalid profile warns but is returned (can't be skipped)                                                            |
| Tests         | `src/lib/projects.test.js` — 22 new tests: one rejecting case per validation rule, strict/lenient behavior, sort order, enum snapshot, plus seed-data integration (8 valid projects, 2 per category, valid profile)                            |
| Seed projects | `src/data/projects.json` — 8 placeholder projects (2 per category, dates 2025-03→2026-05, 2 featured, video entries with public sample YouTube/Vimeo ids, PT+EN throughout, explicitly marked "Projeto demonstrativo / Placeholder project")   |
| Seed profile  | `src/data/profile.json` — placeholder name/tagline/bio, the 4 services keyed by the category enum, placeholder email/socials                                                                                                                   |
| Thumbnails    | `public/images/projects/p-00{1..8}-thumb.svg` — lightweight 1600×1000 (16:10 = `--aspect-thumb`) neutral SVG placeholders                                                                                                                      |

## 2. Verification results

| Check                  | Result                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`         | ✅ clean                                                                                                                                        |
| `npm run check:tokens` | ✅ clean (data JSON and public SVGs are outside its scope by design)                                                                            |
| `npm run test`         | ✅ 24/24 (2 scaffold + 22 new)                                                                                                                  |
| `npm run build`        | ✅ JS 60.4 kB gzip — unchanged, since `App.jsx` intentionally does not import the data layer yet (wiring happens in step 5 with the components) |

## 3. Deviations from spec

None in the schemas — field names and rules match the content-model tables exactly. Two implementation details worth recording:

1. **Pure loaders for testability.** Validation lives in exported `loadProjects(raw, { strict })` / `loadProfile(raw, { strict })`; the module applies `strict: import.meta.env.DEV` only at its boundary. Both dev and prod failure modes are unit-tested without env stubbing.
2. **Profile failure mode differs from projects** (spec only defined the project case): an invalid profile can't be "skipped", so non-strict mode warns and returns it as-is.

## 4. Issues found & fixed

None.

## 5. Decisions of record

- Seed thumbnails are SVG rather than the WebP the spec mandates for real content — placeholder-only; the schema/docs still require WebP at the v1.1 content pass.
- Sample video ids point to public YouTube/Vimeo demo videos so step 5's embed work can be tested against real players.
- All placeholder copy is self-identifying ("Projeto demonstrativo — conteúdo provisório") so unfinished content can't silently ship at launch.

## 6. Next steps

Roadmap v1 step 3: i18n layer — `I18nContext` + `useI18n()` (`lang`, `setLang`, `t`, `pick`), `pt.json`/`en.json` dictionaries with key-parity test, language detection/persistence. Awaiting user review of this step first.
