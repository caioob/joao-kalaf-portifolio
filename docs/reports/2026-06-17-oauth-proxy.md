# 2026-06-17 — GitHub OAuth proxy (v2 Step 4)

Roadmap: [05 — v2 Step 4](../05-roadmap.md). Spec: [07 — Admin CMS §4](../07-admin-cms.md). Gives the Decap admin production auth so the client logs in on the live site with GitHub. Implemented and deployed to Vercel (commits `f6952b7`, `ac5239d`, `ff71dd1`).

## Delivered

- **`api/auth.js`** — Vercel function; redirects to GitHub's authorize URL with `client_id`, a derived `redirect_uri` (`/api/callback`), `scope: repo`, and `state`. Dependency-free.
- **`api/callback.js`** — exchanges the `code` for an access token (`fetch` to GitHub), then returns the HTML page that completes Decap's `postMessage` handshake (`authorizing:github` → `authorization:github:success:{token}`).
- **`dev-local` npm script** + `.gitignore`/`package-lock` updates; AGENTS.md notes.
- **Vercel env**: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (trimmed in code to tolerate stray whitespace).
- `config.yml` `backend.base_url` / `auth_endpoint` point Decap at the proxy.

## Verification

- Deployed to Vercel; **GitHub login on the live `/admin` works** end-to-end (the two follow-up commits fixed env-var whitespace + the `state` param, then the exact `postMessage` protocol).

## Review notes (optional hardening, non-blocking for single-user)

- `state` carries Decap's `site` value rather than a random nonce and isn't validated on callback — so it isn't providing CSRF protection. Standard for Decap proxies; acceptable for one editor.
- `callback.js` could validate `e.origin` against the admin origin before posting the token.
- The token is interpolated into the inline script; GitHub tokens are `[A-Za-z0-9_]`, so no injection surface, but a JSON-escaped injection or `Content-Security-Policy` would be tidier.

## Onboarding (per docs/07 §5)

Client needs a GitHub account with collaborator (write) access to `caioob/joao-kalaf-portifolio`; then `/admin` → "Login with GitHub" → authorize once. A new deployment/fork needs its **own** GitHub OAuth App (callback `https://<url>/api/callback`).

## Next

Step 5 — Decap → image pipeline wiring + content guard.
