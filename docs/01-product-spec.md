# 01 — Product Spec

## Purpose

João Kalaf's portfolio is a bilingual PT-BR/EN **showcase**, optimized for the guided path from finished work to a reviewed, polished public project. It is not a lead-generation, analytics, biography, services, or contact product.

The public page contains João's name, an optional logo, the language control, a filterable work showcase, and project detail dialogs. A project must be reachable within two interactions from landing.

## Users and ownership

- **Visitor:** browses published work in Portuguese or English, filters by primary discipline, opens a project, and may use its stable deep link.
- **Portfolio Owner:** João is the sole editor in v1. The model stores content independently from editor identity so future roles can be introduced without changing project ownership.
- **External Reviewer:** may receive one revocable, authenticated Vercel preview link. Feedback is out of band; João records the final review attestation in the publication pull request.

## Public requirements

### Showcase

- Projects display in João's global showcase rank; newly created projects start at the bottom.
- Cards show only title and primary discipline. They do not show date, featured status, bio, contact information, or conversion calls to action.
- Primary-discipline filters are generated from active catalog entries that currently have published projects. The filter state is shareable as `#work/<discipline-id>`.
- The language is inferred from the browser on first visit and persisted afterward. All public content that is localized must have both PT-BR and EN before it can publish.

### Project detail

- A project opens in an accessible modal with title, primary discipline, optional secondary disciplines, optional tools, optional client/brand and bilingual role, optional narrative, ordered media, and external links.
- `#project/<project-slug>` opens the same modal and browser back/forward preserves the expected state.
- The cover is one selected gallery image. It receives the card crop automatically; an optional focal point protects its composition. Video may appear elsewhere in the ordered gallery but cannot be the cover.
- Image alt text and video title are required in both languages. Hosted videos are limited to YouTube, Vimeo, and Adobe CCV embeds.

### Preview and publication

- `main` is production. It contains only valid publishable content and is protected in GitHub.
- `content-preview` is the one stable editing and review branch. Decap saves there and Vercel deploys it as a restricted preview.
- Preview mode may keep incomplete projects saved, but the public grid renders only structurally safe projects and shows a small checklist naming every publication blocker.
- Publishing is a batch operation: João opens a pull request from `content-preview` to `main`, verifies the gate, records the final review attestation, and merges. A single incomplete record blocks the batch.
- The Vercel build is part of the gate: it checks strict validation, image generation, lint, token rules, tests, and the production build. Branch protection and Vercel access restriction are configured in their respective dashboards.

## Accessibility, performance, and privacy

- Keyboard operation, dialog focus handling, visible focus, translated `lang`, and bilingual alt text are non-negotiable.
- The public application has no runtime dependency beyond React and ReactDOM and stays below 150 kB gzip JavaScript.
- Images use committed responsive WebP variants; video embeds are mounted only in an open dialog.
- Leads and analytics are separate future systems, not hidden features of this portfolio.

## Non-goals for v1

- About, Contact, services, biography, email, socials, forms, and analytics.
- Per-project release selection, direct production writes, unreviewed publication, or public preview URLs by default.
- Permanent deletion. Projects and disciplines are archived; restoring them goes through `content-preview` and the normal gate.
