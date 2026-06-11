# Report — Scaffolding (Roadmap v1, Step 1)

**Date:** 2026-06-11
**Scope:** [Roadmap §v1 step 1](../05-roadmap.md) — project scaffold, tooling, folder structure, design tokens.
**Status:** ✅ Complete. All checks green. Ready for step 2 (content layer).

## 1. What was delivered

| Area              | Delivered                                                                                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build             | Vite 8 + React 19.2 + Tailwind CSS 4.3 via `@tailwindcss/vite` (per [architecture §1](../02-architecture.md))                                                                                                                          |
| Folder structure  | As specced in [architecture §2](../02-architecture.md): `src/styles/`, `src/components/layout/`, `src/test/`, `scripts/`, `public/fonts/` (`src/data`, `src/lib`, `src/i18n` arrive with step 2–3)                                     |
| Design tokens     | `src/styles/theme.css` — all color, typography, layout, and motion tokens from [design §2–§6](../03-design-system.md) in one `@theme` block                                                                                            |
| Base styles       | `src/styles/index.css` — Tailwind import, `@font-face`, body defaults, `::selection`, global `:focus-visible` ring, `prefers-reduced-motion` kill-switch                                                                               |
| Fonts             | Fraunces (opsz variable) + Inter (wght variable), self-hosted woff2 in `public/fonts/`, preloaded in `index.html`. Sourced from `@fontsource-variable/*` dev packages (kept as devDependencies for future updates) — no CDN at runtime |
| Layout primitives | `Section.jsx` (rhythm via `--spacing-section`; scroll-reveal deferred to polish pass) and `Container.jsx` (width via `--container-site`)                                                                                               |
| Token enforcement | `scripts/check-tokens.mjs` (`npm run check:tokens`) — fails on hex colors, arbitrary-value utilities, or raw palette classes anywhere in `src/` except `theme.css`                                                                     |
| Quality tooling   | ESLint 10 (flat config, react-hooks + react-refresh), Prettier 3, Vitest 4 + Testing Library (jsdom)                                                                                                                                   |
| Placeholder app   | `App.jsx` renders a hero through `Section > Container` using only token utilities — proves the pipeline end-to-end; hardcoded PT strings are temporary until the i18n layer (step 3)                                                   |
| Repo              | `git init` (branch `main`), `.gitignore`. No commits yet                                                                                                                                                                               |

Runtime dependencies: **`react` + `react-dom` only**, per the architecture's zero-dependency policy.

## 2. Verification results

| Check           | Command                | Result                                                                                                                              |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Lint            | `npm run lint`         | ✅ clean                                                                                                                            |
| Token rule      | `npm run check:tokens` | ✅ no raw visual values outside `theme.css`                                                                                         |
| Tests           | `npm run test`         | ✅ 2/2 (App smoke tests)                                                                                                            |
| Build           | `npm run build`        | ✅ JS 60.4 kB gzip (budget: <150 kB, [spec FR-5](../01-product-spec.md)), CSS 3.4 kB gzip                                           |
| Built CSS audit | grep `dist/`           | ✅ custom utilities (`max-w-site`, `py-section`, `text-display`, `ease-standard`, `bg-accent`) and both `@font-face` blocks present |

## 3. Deviations from spec (docs already synced)

1. **`--container-max` → `--container-site`.** The specced name would generate `max-w-max`, which collides with Tailwind's built-in `max-w-max` (max-content). Updated in design §4/§8.
2. **`--spacing-grid-gap` → `--spacing-grid`.** The original name produced the awkward utility `gap-grid-gap`. Updated in design §4.
3. **`--spacing-section` holds the per-side value** (`clamp(2rem, 5vw, 3rem)`, 32→48px). Applied as `py-section` on each `Section`, adjacent sections yield exactly the specced 64→96px rhythm. The runbook stays a one-line edit. Updated in design §4.

## 4. Issues found & fixed

- **Testing Library auto-cleanup didn't run** (second test saw two rendered Apps): Vitest is configured without injected globals, so RTL's automatic `afterEach` never registers. Fixed with explicit `afterEach(cleanup)` in `src/test/setup.js`.

## 5. Decisions of record

- **Vitest without globals** — tests import `describe/it/expect` explicitly; keeps ESLint config simple and imports honest.
- **Prettier style:** `printWidth: 100`, no semicolons, single quotes.
- **Fraunces uses the optical-sizing (opsz) variable file** — better rendering across display sizes; Inter uses the weight (wght) file. Latin subset only (~115 kB total fonts).
- **Favicon** is a temporary accent-colored placeholder; real mark pending client brand (README checklist).

## 6. Next steps

Roadmap v1 step 2: content layer — `Project`/`Profile` schemas, validation in `src/lib/projects.js` + tests, seed `projects.json` (6–8 sample projects, 2 per category) and `profile.json` per the [content model](../04-content-model.md).
