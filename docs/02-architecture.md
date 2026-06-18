# 02 — Architecture

## 1. Stack & dependency policy

| Layer       | Choice                                  | Why                                                                                |
| ----------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| Build       | Vite (latest)                           | Fast, zero-config static output                                                    |
| UI          | React 19                                | Required by project; hooks only, no class components                               |
| Styling     | Tailwind CSS v4 via `@tailwindcss/vite` | Required; v4 = CSS-first config with `@theme` tokens, no `tailwind.config.js`      |
| Language    | JavaScript + JSDoc types                | Small project; JSDoc on the data layer gives editor safety without a TS build step |
| Tests       | Vitest + @testing-library/react         | Native Vite integration                                                            |
| Lint/format | ESLint (flat config) + Prettier         | Standard                                                                           |

**Dependency policy: ship with zero runtime deps beyond `react` and `react-dom`.**
Explicitly _not_ used in v1 — each is replaced by ~30 lines of our own code:

- ❌ react-router → one route; filter state lives in the URL hash (`hashchange` listener).
- ❌ i18next / react-intl → tiny context + two JSON dictionaries (§4).
- ❌ Redux/Zustand → `useState` + context covers everything.
- ❌ framer-motion → CSS transitions satisfy the motion guidelines ([design §6](03-design-system.md)).

**v2 carve-out (the admin CMS — [doc 07](07-admin-cms.md) — and image pipeline — [doc 08](08-responsive-images.md)).** The rule above governs the **public app bundle**, and v2 keeps it intact:

- Decap (`decap-cms-app`) is a **devDependency**, vendored as static assets under `public/admin/`; it is never imported by `src/`, so it cannot enter the public bundle.
- `sharp` stays a **devDependency** used only by the build-time image pipeline (shared with the Behance importer).
- The OAuth proxy (`api/`) is a **dependency-free** Vercel function (uses `fetch`); it is server-side, not part of any client bundle.
- Net effect on the shipped site: **zero** new runtime JS. `check:tokens` and the `< 150 kB` budget still apply and still pass.

## 2. Folder structure

```
joaokalaf/
├── docs/                      # these specs
├── content/                   # v2: content lives here, edited via Decap (doc 07)
│   ├── projects/*.json        # ← one file per project (was src/data/projects.json)
│   └── profile.json           # name, bio, socials
├── api/                       # v2: GitHub OAuth proxy for Decap (doc 07 §4), dep-free
├── public/
│   ├── admin/                 # v2: vendored Decap editor (index.html + config.yml)
│   ├── images/projects/       # project thumbnails & gallery images (+ AVIF/WebP ladder, doc 08)
│   └── og-image.png
├── src/
│   ├── components/            # presentational; one file per component from design §5
│   │   ├── layout/
│   │   │   ├── Section.jsx    # vertical rhythm + scroll reveal (design §4, §6)
│   │   │   └── Container.jsx  # max-width + horizontal padding (design §4)
│   │   ├── Navbar.jsx
│   │   ├── LanguageToggle.jsx
│   │   ├── Hero.jsx
│   │   ├── FilterBar.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Picture.jsx        # v2: <picture> srcset/sizes wrapper (doc 08 §8)
│   │   ├── ServiceList.jsx
│   │   ├── ContactSection.jsx
│   │   └── Footer.jsx
│   ├── lib/
│   │   ├── projects.js        # repository: the ONLY module that reads content/*.json
│   │   ├── projects.test.js
│   │   ├── images.js          # v2: responsive ladder constant + srcset builder (doc 08 §3)
│   ├── i18n/
│   │   ├── I18nContext.jsx    # provider + useI18n() hook
│   │   ├── pt.json            # UI strings
│   │   ├── en.json
│   │   └── i18n.test.js
│   ├── styles/
│   │   ├── theme.css          # ← ALL design tokens (@theme) — the only file edited
│   │   │                      #   for design changes; see design §8 change runbook
│   │   └── index.css          # @import "tailwindcss" + theme.css, @font-face, base styles
│   ├── App.jsx                # section layout + filter-hash + modal state
│   └── main.jsx
├── index.html
└── package.json
```

Rules:

- `components/` never import JSON directly — data arrives via props or the `lib/`/`i18n/` modules.
- No component exceeds ~150 lines; split before it does.
- **Tokens or nothing** ([design §1.5](03-design-system.md)): components use only semantic token utilities; raw palette classes, arbitrary values, and hex colors live exclusively in `src/styles/theme.css`. Page sections always compose `Section > Container` rather than spacing themselves.

## 3. Content layer — the v2 seam

The single most important structural decision. All project data flows through `src/lib/projects.js`:

```js
/** @typedef {import('./types').Project} Project */

/** @returns {Project[]} sorted newest-first, validated */
export function getProjects() {
  /* reads projects.json in v1 */
}

/** @returns {Project[]} */
export function getProjectsByCategory(category) {}

export const CATEGORIES = ['video', 'motion', 'product', 'graphic']
```

- The repository **validates** each record on load (required fields, known category, `{pt,en}` completeness) and throws in dev / skips-and-warns in prod, so a malformed JSON edit fails loudly instead of rendering broken cards.
- **v2 (Decap, git-based):** the functions stay **synchronous build-time imports** — only the source moves from a single `src/data/projects.json` to `import.meta.glob('/content/projects/*.json', { eager: true })`. Decap edits those same files and commits; a rebuild publishes. No async, no loading state, no fetch — the seam barely changes. (The earlier Supabase plan, which *would* have made these async, was not taken; see [roadmap v2](05-roadmap.md).)

## 4. i18n design

- `I18nContext` holds `lang` (`"pt" | "en"`) and setter.
- Initial value: `localStorage.lang` → else `navigator.language.startsWith("pt") ? "pt" : "en"`.
- `useI18n()` returns `{ lang, setLang, t }`:
  - `t("nav.work")` — flat-key lookup in `pt.json`/`en.json` for **UI strings**; missing key logs a warning and falls back to EN.
  - Content fields (`{ pt, en }` objects from the content model) are resolved with a helper `pick(field)` → `field[lang] ?? field.en`.
- On change: persist to `localStorage`, set `document.documentElement.lang`.

## 5. State map (entire app)

| State                  | Lives in                  | Mechanism                              |
| ---------------------- | ------------------------- | -------------------------------------- |
| Language               | `I18nContext`             | context + localStorage                 |
| Active category filter | URL hash (`#work/motion`) | `useSyncExternalStore` on `hashchange` |
| Open project (modal)   | `App`                     | `useState(projectId \| null)`          |

Nothing else is stateful. No effects for data (it's a static import).

## 6. Testing

- `lib/projects.test.js` — validation rejects bad records; sorting; category filter; enum stability.
- `i18n/i18n.test.js` — `t()` lookup + fallback; `pick()` fallback; language detection logic.
- One smoke test: `App` renders, filter clicks change visible cards, modal opens/closes.
- **Token enforcement:** `npm run check:tokens` — a small grep-based script that fails if any file under `src/` other than `styles/theme.css` contains a hex color, a Tailwind arbitrary value (`[...]` utility), or a raw palette class (`-(zinc|gray|neutral|stone|red|orange|amber|...)-\d`). Keeps the design-change runbook ([design §8](03-design-system.md)) honest.
- **E2E rendering battery:** `npm run test:e2e` (`scripts/e2e-render.mjs`) drives a headless browser against **`vite dev`** and asserts the app actually renders: hero, one card per `content/projects/*.json`, no failed `/content`·`/images` requests, no uncaught page errors, no broken thumbnails, plus filter / modal / language-toggle interactions. It targets the dev server on purpose — that's the strictest renderer (strict validation, content served over HTTP via the eager glob) and the only place a URL-unsafe content filename surfaces (`test`/`build` bundle the JSON and miss it). Run it after any data, loader, or component change. Uses the existing `playwright` dep — no new framework.
- CI-ready scripts: `npm run lint`, `npm run check:tokens`, `npm run test`, `npm run test:scripts`, `npm run test:e2e`, `npm run build`.

## 7. Build & deployment

- `npm run build` → fully static `dist/` (HTML/CSS/JS/images). No server code for the public site.
- **Decided & live: Vercel (Hobby plan, free — project is non-commercial).** The GitHub repo is connected via Vercel's Git integration: every push to `main` builds (`npm run build`, auto-detected Vite preset, zero config files) and deploys; other branches/PRs get preview URLs. Production URL: <https://joao-kalaf-portifolio.vercel.app/>. No `base` path needed (site is served from the domain root).
- If a custom domain is attached later: add it in the Vercel dashboard and update the absolute URLs in `index.html` (`canonical`, `og:url`, `og:image` ×2).

### v2 additions to the build (Decap + images)

- **Image generation step.** `scripts/generate-images.mjs` expands each committed WebP master into the responsive WebP ladder ([doc 08](08-responsive-images.md)) via `sharp`. **Resolved (2026-06-17): WebP-only, variants committed, idempotent generator.** `build` runs it first (`node scripts/generate-images.mjs && vite build`); since variants are committed it's a near-instant no-op, and a Decap-added master generates only its own few rungs on that deploy. Committing (~250 small files) was chosen over build-time-only because re-encoding the whole ladder every Vercel deploy would add minutes; WebP-only (no AVIF) keeps the committed footprint small. `npm run images` runs it standalone.
- **OAuth function.** `api/` deploys as a Vercel serverless function (the only server code, for Decap auth — [doc 07 §4](07-admin-cms.md)). `client_id`/`client_secret` are Vercel env vars; the public site itself still needs no env vars.
- **Publish loop.** Decap commit → push to `main` → the same build runs (image step included) → live in ~1 min. No external rebuild webhook (git-based, unlike a hosted headless CMS).
