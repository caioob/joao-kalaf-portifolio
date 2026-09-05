# 02 — Architecture

## Boundaries

The public application is Vite, React, Tailwind v4, JavaScript/JSDoc, Vitest, ESLint, and Prettier. It has no runtime dependency beyond `react` and `react-dom`: no router, CMS library, state library, i18n library, or animation library.

Decap is a vendored static application under `public/admin/`, never imported by `src/`. Sharp and the Behance importer are build tools only. The OAuth proxy in `api/` is a dependency-free Vercel function. Neither enters the public JavaScript budget.

## Content repository

`src/lib/projects.js` is the one public-content seam. It owns all JSON imports, strict validation, catalog reference checks, display ordering, preview blockers, and profile access. Components receive records through props and must never import a content JSON file.

```js
getPortfolio() // { projects, disciplines, visibleDisciplines, previewChecklist }
getProjects()
getProjectsByDiscipline(id)
getVisibleDisciplines()
getProfile()
```

The repository has two modes:

- normal/production: invalid content throws, so it cannot deploy;
- `VITE_PORTFOLIO_MODE=preview`: invalid projects remain inspectable in `previewChecklist`, while `isRenderableProject()` protects the visitor-facing grid from malformed records.

The code layout is deliberately shallow:

```
content/{projects,archive/projects,profile.json,disciplines.json}
public/admin/{index.html,config.yml,editorial.js}
scripts/generate-images.mjs
src/{components,lib,i18n,styles}
```

## Public state

| State             | Location                              | Contract                                                 |
| ----------------- | ------------------------------------- | -------------------------------------------------------- |
| Language          | `I18nContext` + `window.localStorage` | Browser inferred, then persisted; updates `<html lang>`. |
| Active discipline | `#work/<discipline-id>`               | Dynamic catalog values only; invalid hashes mean all.    |
| Open project      | `#project/<slug>`                     | Modal is deep-linkable and reacts to browser history.    |

There is no runtime content fetch and no loading state. Vite eagerly imports each production project JSON at build time.

## Media path

`scripts/generate-images.mjs` and `src/lib/images.js` share the WebP ladder definition. The generator finds each project's selected gallery cover, processes it for the thumbnail slot, then processes every gallery image at native-gallery sizing. It rewrites canonical source paths and intrinsic dimensions in the content record and writes only missing variants.

## Testing and checks

- Unit tests cover content validation, catalog references, strict/preview behavior, deep-link and filter state, i18n, and visual components.
- `npm run test:e2e` runs a Playwright rendering battery against `vite dev`; it catches content-module and asset requests that bundled tests cannot.
- `npm run check:tokens` prevents raw visual values outside `src/styles/theme.css`.
- The full verification sequence is lint → token check → app tests → script tests → build → E2E. Public JavaScript must remain below 150 kB gzip.

## Deployment

Vercel deploys `main` to production and `content-preview` to a restricted preview. A branch pull request is the deliberate publication transition; GitHub branch protection and Vercel preview sharing enforce it outside application code. See [07](07-admin-cms.md).
