# 05 — Roadmap

## v1 — Static portfolio (first build)

Goal: the complete public site live on a real URL, with placeholder-quality content if real content isn't ready.

1. Scaffold Vite + React + Tailwind v4; tooling (ESLint, Prettier, Vitest); folder structure from [architecture §2](02-architecture.md).
2. Content layer: schemas, validation, `lib/projects.js` + tests; seed `projects.json` with 6–8 sample projects (2 per category) and `profile.json`.
3. i18n layer + tests.
4. Design tokens in `index.css`; self-hosted fonts.
5. Components, in dependency order: Navbar/LanguageToggle → Hero → FilterBar/ProjectCard (grid) → ProjectDetail modal → ServiceList/About → Contact/Footer.
6. Polish pass: motion, reduced-motion, keyboard walkthrough, empty states.
7. SEO/meta + OG image; `npm run build`; deploy to Vercel.

**Exit criteria:** product-spec FRs all met; Lighthouse ≥ 90 across the board; both languages complete.

## v1.1 — Real content & launch

1. Content session with the designer: resolve the README "pending input" checklist (name, bio, accent color, font, real projects, media).
2. Replace seed data; optimize delivered images (WebP, correct crops).
3. Translation review (PT ↔ EN).
4. Custom domain + OG/share preview check (WhatsApp, LinkedIn).
5. Optional: privacy-friendly analytics (Plausible/GoatCounter) if the designer wants traffic numbers.

## v2 — Admin interface ("add projects" UI)

Goal: the designer adds/edits/removes projects through a friendly form — no JSON, no code, no developer.

Because v1 funnels all data access through `lib/projects.js` ([architecture §3](02-architecture.md)), v2 swaps that module's internals and adds an `/admin` area; the public components don't change.

### Option A — Supabase + custom `/admin` page (recommended)

- Supabase free tier: Postgres (`projects` table mirroring the schema), Storage (images), Auth (single email login for the designer).
- Site stays fully static; the public page fetches published projects via the Supabase JS client; `/admin` is a route in the same React app with a form generated from the `Project` schema, image upload to Storage, and a publish toggle.
- **Pros:** we control the UX completely (the form can be in PT, match the design system, validate with the same rules); one codebase; free.
- **Cons:** we build and maintain the admin UI ourselves (~the size of the public site); auth/security is our responsibility (single-user + RLS keeps it simple).

### Option B — Headless CMS (Sanity free tier as default candidate)

- Content modeled in the CMS studio; the designer edits in the CMS's hosted dashboard; the site fetches at runtime or rebuilds via webhook.
- **Pros:** near-zero admin code; mature editing UX (drafts, image pipeline, history) for free.
- **Cons:** third-party dashboard in English with its own learning curve — weaker fit for the "user-friendly, made for this user" goal; vendor coupling; content schema lives partly outside the repo.

### Recommendation

**Option A.** The whole point of v2 is a friendly experience for one specific non-technical user, in their language, with exactly the fields they need — that's the thing a custom form does better than a general-purpose CMS. The decision can be deferred until v2 starts with zero cost, since both options plug into the same repository seam.

### v2 work outline (Option A)

1. Supabase project: table + RLS (public read of published rows, authenticated write), storage bucket, single auth user.
2. Migration script: `projects.json` → table (schema already matches 1:1).
3. `lib/projects.js` → async Supabase queries; loading/error states in `App`.
4. `/admin`: login screen, project list, create/edit form (client-side validation reusing the v1 rules), image upload with preview, delete with confirmation, publish/unpublish.
5. Smoke tests for the new repository functions against a local Supabase instance.
