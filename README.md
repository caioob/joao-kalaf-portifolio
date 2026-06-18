# Portfolio — Multidisciplinary Designer

A portfolio website for a designer working across four disciplines:

- 🎬 **Video Editing**
- 🌀 **Motion Design**
- 📱 **Product Design**
- 🎨 **Graphic Design**

**Status: 🚀 v1 complete — live at <https://joao-kalaf-portifolio.vercel.app/>.** Deployed on Vercel (Hobby), auto-deploy on every push to `main` ([deploy report](docs/reports/2026-06-12-deploy.md)). Next: the v1.1 real-content pass (pending-input checklist below).

## Agreed decisions

| Decision           | Choice                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack              | React + Tailwind CSS (Vite)                                                                                                                                                                       |
| Content management | Static JSON in v1; architecture reserves a clean seam for a v2 admin UI                                                                                                                           |
| Languages          | Bilingual PT-BR / EN with a persisted toggle                                                                                                                                                      |
| Visual direction   | Light & minimal — white space, warm neutrals, editorial typography                                                                                                                                |
| Design changes     | Fully token-driven: every visual value is a named token in `src/styles/theme.css`; client tweaks follow the [change runbook](docs/03-design-system.md#8-change-runbook) (usually a 1–2 line edit) |
| Hosting            | **Vercel (Hobby, free)** — GitHub integration, deploy-on-push to `main`, live at <https://joao-kalaf-portifolio.vercel.app/>                                                                      |

## Documentation index

| Doc                                              | Contents                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01 — Product Spec](docs/01-product-spec.md)     | Goals, audience, site map, functional requirements, v1/v2 scope                                                                                                                                                                                                                                                                                                                                     |
| [02 — Architecture](docs/02-architecture.md)     | Stack, folder structure, content layer seam, i18n design, tooling, deployment                                                                                                                                                                                                                                                                                                                       |
| [03 — Design System](docs/03-design-system.md)   | Palette, typography, spacing, component inventory, motion & accessibility                                                                                                                                                                                                                                                                                                                           |
| [04 — Content Model](docs/04-content-model.md)   | Project/Profile schemas, i18n dictionaries, how to add a project in v1                                                                                                                                                                                                                                                                                                                              |
| [05 — Roadmap](docs/05-roadmap.md)               | v1 → v1.1 → v2 (admin interface) phases and recommendations                                                                                                                                                                                                                                                                                                                                         |
| [06 — Behance Import](docs/06-behance-import.md) | CLI tool to dump a Behance profile into portfolio data format                                                                                                                                                                                                                                                                                                                                       |
| [07 — Admin CMS](docs/07-admin-cms.md)           | Decap (git-based) editor: config schema, GitHub OAuth backend, client onboarding                                                                                                                                                                                                                                                                                                                    |
| [08 — Responsive Images](docs/08-responsive-images.md) | High-res-without-perf: AVIF/WebP ladders, `sizes` contract, image pipeline, perf budget                                                                                                                                                                                                                                                                                                       |
| [Reports](docs/reports/)                         | Per-step implementation reports ([scaffolding](docs/reports/2026-06-11-scaffolding.md) · [content layer](docs/reports/2026-06-11-content-layer.md) · [i18n](docs/reports/2026-06-11-i18n.md) · [components](docs/reports/2026-06-11-components.md) · [polish](docs/reports/2026-06-12-polish.md) · [seo-build](docs/reports/2026-06-12-seo-build.md) · [deploy](docs/reports/2026-06-12-deploy.md) · [content-restructure](docs/reports/2026-06-17-content-restructure.md) · [responsive-images](docs/reports/2026-06-17-responsive-images.md) · [decap-admin-ui](docs/reports/2026-06-17-decap-admin-ui.md)) |

## Pending input (needed from the designer before v1 content pass)

- [ ] Name / brand to display (site title, hero, domain idea)
- [ ] Bio text (PT and EN, or PT to be translated)
- [ ] Initial list of 6–12 projects with titles, categories, descriptions and media (thumbnails, video links)
- [ ] Accent color preference (see design system §2 for the default proposal)
- [ ] Display font approval (see design system §3)
- [ ] Social links + contact email
- [ ] Profile photo (optional)
- [ ] Custom domain (optional — site is live on the free `*.vercel.app` URL; if one is bought, attach it in the Vercel dashboard and update `canonical`/`og:url`/`og:image` in `index.html`)
