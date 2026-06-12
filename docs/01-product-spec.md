# 01 — Product Spec

## 1. Purpose & goals

A single-page portfolio that presents a multidisciplinary designer (video editing, motion design, product design, graphic design) to potential clients and employers.

**Goals, in priority order:**

1. **Show the work.** Visitors reach a project — and ideally play a video — within two interactions of landing.
2. **Communicate range.** The four disciplines are visible immediately and browsable independently.
3. **Convert.** A clear, low-friction contact path (email + socials) from anywhere on the page.
4. **Stay maintainable.** Adding a project must not require touching component code (v1: edit one JSON file; v2: admin form).

**Success criteria:**

- Lighthouse ≥ 90 on Performance, Accessibility, Best Practices, SEO (mobile).
- Works on mobile, tablet, desktop; no horizontal scroll at any breakpoint ≥ 320 px.
- A new project can be added in under 5 minutes by editing data only.

## 2. Audience

- **Primary:** potential freelance clients (agencies, brands, creators) in Brazil and abroad — hence bilingual PT-BR/EN.
- **Secondary:** recruiters and studios evaluating the designer for contract work.

Both audiences skim. The page must communicate competence in the first viewport and reward scrolling with work samples, not text.

## 3. Site map (one-pager)

Single route, anchor-linked sections. No client-side router in v1.

```
┌──────────────────────────────────────────┐
│ Navbar    [Work] [About] [Contact] [PT/EN]│  sticky, translucent
├──────────────────────────────────────────┤
│ 1. Hero      name · roles · tagline · CTA │
│ 2. Work      FilterBar + project grid     │
│              └── ProjectDetail (modal)    │
│ 3. About     bio + the four services      │
│ 4. Contact   email CTA + social links     │
│ Footer       copyright · language toggle  │
└──────────────────────────────────────────┘
```

## 4. Functional requirements

### FR-1 Work grid & filtering

- Grid of `ProjectCard`s, newest first, `featured` projects may be visually emphasized.
- `FilterBar` with five options: **All** (default) + the four categories (`video`, `motion`, `product`, `graphic` — the canonical enum, see [content model §1](04-content-model.md)).
- Filtering is instant, client-side, and reflected in the URL hash (e.g. `#work/motion`) so a filtered view is shareable. No page reload.
- Empty category shows a friendly empty state, never a blank area.

### FR-2 Project detail

- Clicking a card opens a **modal** (`ProjectDetail`) — no route change, background scroll locked, closable via ✕, overlay click, and `Esc`.
- Shows: title, category, date, description, tools, media gallery, external links.
- Video media render as lazy YouTube/Vimeo embeds — the iframe loads only when the modal opens (FR-5).

### FR-3 Bilingual PT-BR / EN

- Toggle in the navbar, instant switch, no reload.
- Choice persisted to `localStorage`; first visit defaults from `navigator.language` (`pt-*` → PT, else EN).
- **All** user-visible strings come from the i18n layer — no hardcoded copy in components. Content fields are stored as `{ pt, en }` pairs.
- `<html lang>` updates with the selection.

### FR-4 Contact

- `mailto:` CTA button + social links (Behance/Instagram/LinkedIn/Vimeo — final list pending, see README).
- No contact form in v1 (forms require a backend or third-party service — deferred, see §6).

### FR-5 Performance

- Static build, no runtime data fetching.
- Images lazy-loaded (`loading="lazy"`), explicit dimensions to prevent layout shift, modern formats (WebP/AVIF) requested from the designer.
- Video embeds never load on the grid — thumbnail images only; iframes mount inside the opened modal.
- JS budget: < 150 kB gzipped total (React included).

### FR-6 Accessibility (WCAG 2.1 AA)

- Full keyboard operability (filter, cards, modal focus trap + focus return).
- Visible focus states, contrast ≥ 4.5:1 for text, alt text required by the content schema.
- `prefers-reduced-motion` disables non-essential animation.

### FR-7 SEO & sharing

- Title/description meta, Open Graph + Twitter card tags, OG image.
- Semantic landmarks (`header`, `main`, `section`, `footer`), single `h1`.

## 5. Scope

### v1 (this build)

Everything in §4, with content from a static JSON file. Deployed as a static site.

### v2 (planned — drives architecture today)

A **user-friendly admin interface** where the designer logs in and adds/edits/removes projects through a form (fields mirror the `Project` schema), including image upload. Requires auth + storage — options compared in [roadmap §3](05-roadmap.md). The v1 content layer is built behind a repository seam ([architecture §3](02-architecture.md)) specifically so v2 swaps the data source without UI rewrites.

### Non-goals

- No blog, no case-study pages with their own routes (modal is enough for v1).
- No backend, database, or auth in v1.
- No analytics initially (can add a privacy-friendly script later).
- No CMS in v1.
- No dark mode in v1 (light & minimal is the identity; revisit on request).
