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

## 2. Folder structure

```
boquinha/
├── docs/                      # these specs
├── public/
│   ├── images/projects/       # project thumbnails & gallery images
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
│   │   ├── ServiceList.jsx
│   │   ├── ContactSection.jsx
│   │   └── Footer.jsx
│   ├── data/
│   │   ├── projects.json      # ← the only file edited to add a project (v1)
│   │   └── profile.json       # name, bio, socials
│   ├── lib/
│   │   ├── projects.js        # repository: the ONLY module that reads projects.json
│   │   └── projects.test.js
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
- **v2 migration:** these functions become async (`getProjects()` → fetch from Supabase/CMS) and gain `addProject` / `updateProject` / `deleteProject`. UI components already receive data via props from `App`, so the change is confined to `lib/` plus a loading state in `App`. Nothing else moves.

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
- CI-ready scripts: `npm run lint`, `npm run check:tokens`, `npm run test`, `npm run build`.

## 7. Build & deployment

- `npm run build` → fully static `dist/` (HTML/CSS/JS/images). No server code, no env vars.
- Deployable to any static host. **Recommendation: Vercel** (zero-config Vite preset, free tier, preview deploys, easy custom domain). Netlify equivalent; GitHub Pages possible (needs `base` config in Vite).
- v2 note: choosing Supabase later keeps the site static (client-side SDK); choosing a build-time CMS would add a rebuild webhook. Either way today's host choice is not a lock-in.
