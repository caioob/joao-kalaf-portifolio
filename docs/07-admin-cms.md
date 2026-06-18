# 07 — Admin CMS (Decap)

How the designer adds/edits/removes projects without touching code. Decision and rationale: `docs/05-roadmap.md` (v2). This doc is the source of truth for the Decap configuration, the OAuth backend, and client onboarding.

## 1. Architecture

Decap is a **git-based** CMS: a standalone static editor at `/admin` that reads and writes the repo's content files through the GitHub API and commits on save. A commit to `main` triggers the existing Vercel build, which regenerates images (doc 08) and publishes. There is **no database and no content API** — content stays in git.

```
client → /admin (Decap, static SPA)
   │  "Login with GitHub"
   ▼
api/auth → api/callback  (OAuth proxy, one Vercel function)
   │  returns a GitHub token to the browser
   ▼
Decap → GitHub API: commit to content/*.json + public/images/...
   ▼
push to main → Vercel build (image pipeline, doc 08) → live
```

**Bundle isolation.** Decap is served as static assets under `public/admin/` and is **never imported by `src/`**, so it cannot enter the public app bundle — the "zero runtime deps" rule (`docs/02-architecture.md` §1) holds. The bundle is vendored — a pinned **`decap-cms`** build (the auto-initializing package that loads `config.yml` itself; *not* `decap-cms-app`, which needs a manual `CMS.init()`) committed at `public/admin/decap-cms.js`, not loaded from a runtime CDN. ESLint ignores `public/admin` (`eslint.config.js`).

**Local access (dev):** Vite dev's SPA history-fallback serves the React app for a bare `/admin/`, so open **`/admin/index.html`** locally (run `npx decap-server` for the local backend). On Vercel (static hosting) `/admin/` resolves to `/admin/index.html` automatically.

## 2. Content layout (set in Step 1)

```
content/
├── projects/
│   ├── p-001-zoho-event-film.json   # one file per project
│   └── …
└── profile.json                      # single document
```

`src/lib/projects.js` globs `content/projects/*.json` (`import.meta.glob`, eager) and validates as before — the seam is unchanged, the storage shape is what moved.

## 3. `config.yml` — collection schema

`public/admin/config.yml` maps the content model (doc 04) to Decap widgets. Key mappings:

- **`backend`**: `name: github`, `repo: <owner>/joao-kalaf-portifolio`, `branch: main`, `base_url`/`auth_endpoint` pointing at the OAuth function (§4).
- **`media_folder`**: a staging path for high-res masters the client uploads; the build pipeline (doc 08) derives the optimized variants. `public_folder` resolves to the served URL.
- **`local_backend: true`** — enables `npx decap-server` for editing against the local filesystem with no GitHub round-trip (dev/testing).

**`projects` collection** (`folder: content/projects`, `format: json`, `extension: json`):

| Field | Widget | Notes |
| --- | --- | --- |
| `id`, `slug` | `string` | `slug` also drives the filename via `slug` config. |
| `category` | `select` | options = the four `CATEGORIES`. |
| `title`, `description` | `object` { `pt`: string, `en`: string } | the `{pt,en}` pattern; `description` allowed empty. |
| `date` | `string` | pattern `^\d{4}-\d{2}$` (Decap `pattern` validation). |
| `thumbnail` | `object` { `src`: image, `alt`: {pt,en} } | one master upload. |
| `media` | `list` with **`types`** | `image` type { src: image, alt: {pt,en} } and `video` type { provider: select, videoId: string, title: {pt,en} } — Decap's discriminated-union equivalent. |
| `tools` | `list` of string | optional. |
| `featured` | `boolean` | optional. |
| `links` | `list` of object { label: {pt,en}, url: string } | optional. |

**`profile`** is a `files` collection with a single `content/profile.json` document mapping `name`, `tagline`, `bio`, `services[4]`, `email`, `socials`, `photo`.

**Validation parity.** Decap field validation (required, `pattern`, select options) mirrors the v1 rules so the client gets inline feedback; `lib/projects.js` remains the build-time backstop (throws in dev, skips-and-warns in prod), and a test asserts every `content/projects/*.json` loads (Step 5). The `{pt,en}` "both required" rule is enforced by the loader, not Decap, since Decap can't express cross-subfield requirements cleanly.

## 4. Backend — GitHub OAuth proxy (Step 4)

Decap's GitHub backend needs an OAuth handshake. We self-host it as **one dependency-free Vercel serverless function** (using `fetch`), not a third-party service:

- `api/auth` — redirects to GitHub's authorize URL with the OAuth App `client_id` and `scope=repo`.
- `api/callback` — exchanges the `code` for an access token and returns it to the Decap window via the `postMessage` handshake Decap expects.
- A **GitHub OAuth App** is registered (callback URL = the deployed `api/callback`); `client_id`/`client_secret` are Vercel env vars, never committed.

No database, no session store — the token lives only in the editor's browser for the session.

## 5. Client onboarding (the GitHub trade-off)

Editing authenticates as a GitHub user, so a one-time setup is required per the decision in `docs/05-roadmap.md`:

1. Client creates a GitHub account (if they don't have one).
2. They're invited as a **collaborator** (write access) on the repo and accept.
3. They visit `/admin`, click **Login with GitHub**, authorize the OAuth App once.

Thereafter: edit in `/admin` → **Publish** → ~1 min later the change is live. A short PT-language how-to (add a project, upload an image, the ~1-min publish wait) lives at the end of this doc / in the README onboarding section.

## 6. Images

The client uploads **one high-res master** per image in Decap's media widget. The Vercel build expands it into the responsive AVIF/WebP ladder and the 16:10 thumbnail crop and records intrinsic dimensions — see `docs/08-responsive-images.md`. The client never deals with sizes, crops, or formats.

## 7. What does not change

- The public site is still static JSON-at-build — no runtime fetching, no new app dependency, same `< 150 kB` bundle budget.
- `src/lib/projects.js` stays the only data seam; components are untouched.
- Adding a project by hand (editing a `content/projects/*.json` file) still works — Decap is a convenience layer over the same files, not a replacement for them.
