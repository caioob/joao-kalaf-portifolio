# João Kalaf Portfolio

Bilingual PT-BR/EN showcase portfolio for João Kalaf. The public product is intentionally work-only: name, optional logo, language switcher, dynamic discipline filters, projects, and project detail dialogs.

Published work lives in `content/projects/`; `content/disciplines.json` is the dynamic catalog; `content/archive/projects/` is excluded from production input. See [the product spec](docs/01-product-spec.md) and [content model](docs/04-content-model.md).

## Authoring and release

João edits `content-preview` through Decap at `/admin/index.html`. That branch gets a restricted Vercel preview. After the preview checklist is clear and final review is complete, João opens a PR into protected `main` and merges the passing batch.

The repository does not configure GitHub branch protection or Vercel preview access itself. The required dashboard setup is in [07 — Admin CMS](docs/07-admin-cms.md).

## Local development

```bash
nix develop
npm ci
npm run dev
```

For local Decap editing, checkout `content-preview` and run `npm run dev-local`; then open `http://localhost:5173/admin/index.html`.

## Verification

```bash
npm run lint && npm run check:tokens && npm run test && npm run test:scripts && npm run build
npm run test:e2e
```

Run E2E after any content, loader, or component change. Public JavaScript has a 150 kB gzip budget.

## Documentation

| Document                                               | Contents                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| [01 — Product Spec](docs/01-product-spec.md)           | Showcase scope, public behavior, preview and publication rules.  |
| [02 — Architecture](docs/02-architecture.md)           | Repository seam, runtime state, build and deployment boundaries. |
| [03 — Design System](docs/03-design-system.md)         | Tokens, typography, layout, motion, accessibility.               |
| [04 — Content Model](docs/04-content-model.md)         | Profile, discipline catalog, projects, validation, archive.      |
| [05 — Roadmap](docs/05-roadmap.md)                     | Completed workflow and operational next step.                    |
| [06 — Behance Import](docs/06-behance-import.md)       | Import tool.                                                     |
| [07 — Admin CMS](docs/07-admin-cms.md)                 | PT-BR Decap workspace, protected preview and PR process.         |
| [08 — Responsive Images](docs/08-responsive-images.md) | WebP cover/gallery pipeline.                                     |
| [CONTEXT.md](CONTEXT.md)                               | Canonical domain vocabulary.                                     |
| [Reports](docs/reports/)                               | Per-roadmap implementation reports.                              |

## Pending client input

- Final logo asset and its one-off background token treatment.
- Accent color and display font approval.
- GitHub branch-protection and Vercel restricted-preview setup.
