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

### Decision (2026-06-17) — Decap CMS, git-based, self-hosted on Vercel

Neither A nor B was chosen. Both options A (Supabase) and B (a hosted headless CMS) move content out of git — a database or a vendor dashboard. A third path fits this repo better: a **git-based CMS** that edits the content files in place, so content never leaves the repo and the public site keeps building from JSON.

**Chosen: Decap CMS**, self-hosted on Vercel with GitHub-OAuth login.

- **Why git-based over Supabase (A):** no database, no datalayer, no runtime data-fetching rewrite. The public site stays static and the "zero runtime deps" rule holds — Decap's `/admin` is a separate static app that never enters the public bundle.
- **Why Decap over self-hosted Tina:** Decap talks to the GitHub API directly from the browser, so the only backend is a tiny OAuth proxy (one Vercel function) — versus Tina's self-hosted stack (a backend wrapper + a KV datalayer + an auth provider), whose Vite/Vercel path is far less trodden.
- **Trade-off accepted:** the editor authenticates as a **GitHub user**, so the client needs a GitHub account with collaborator access (one-time onboarding). We chose this over Tina's username/password auth because it removes nearly all backend risk.

Full design: `docs/07-admin-cms.md`. Image strategy (a parallel v2 goal): `docs/08-responsive-images.md`.

### v2 work outline (spec-driven — author the spec, then implement, then report per step)

**Step 0 — Spec.** Author/extend the docs that govern this work *before* code: this roadmap section, `04-content-model.md` (per-file layout + responsive `Image`), new `07-admin-cms.md`, new `08-responsive-images.md`, `02-architecture.md` (seam, admin area, OAuth function, image build step, dependency carve-out). Reviewed before implementation.

**Step 1 — Content restructure behind the seam.** `src/data/projects.json` (array) → `content/projects/*.json` (one file per project); `profile.json` → `content/profile.json`. `getProjects()`/`getProfile()` load via `import.meta.glob`; pure validators and their tests unchanged. Update `scripts/lib/behance-write.mjs` to emit per-file output. Site output is byte-for-byte identical.

**Step 2 — Responsive image system** (`docs/08-responsive-images.md`). Generalize the `sharp` pipeline to emit the AVIF+WebP width ladder + 16:10 crop and record intrinsic dimensions; add `src/lib/images.js` (ladder constant + `srcset` builder) and a `Picture` component; convert `ProjectCard`/`ProjectDetail`/portrait; regenerate the 15 existing projects; verify the performance budget.

**Step 3 — Decap admin UI** (`docs/07-admin-cms.md`). `public/admin/index.html` + `config.yml` (vendored pinned Decap bundle); schema mapping ({pt,en} objects, `media` image/video types, `category` select, `date` pattern); local editing via `local_backend`.

**Step 4 — GitHub OAuth proxy on Vercel.** One dependency-free serverless function (`api/auth` + `api/callback`) implementing GitHub's OAuth web flow; register the OAuth App; secrets as Vercel env vars. Editing in production: commit → Vercel rebuild.

**Step 5 — Decap → image pipeline wiring + validation + final report.** Client uploads a single high-res master; the Vercel build expands it through the Step 2 pipeline. Add a test asserting every `content/projects/*.json` passes `loadProjects`. Sync CLAUDE.md/AGENTS.md and the README doc index.

Each of Steps 1–5 ends with a report in `docs/reports/` per the required process.

### Superseded options (kept for the record)

The original recommendation was **Option A (Supabase + custom `/admin`)**, with Option B (Sanity) as the headless alternative. Both remain valid futures if requirements change (e.g. a need for instant publish without a rebuild, or auth decoupled from GitHub) — they plug into the same `lib/projects.js` seam.
