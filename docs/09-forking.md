# 09 — Forking for a new client

This codebase is a per-client portfolio. Because Decap and GitHub OAuth bind to a
specific repo + deployment URL, the pragmatic way to onboard a second client is a
**hard fork**: a new repo + Vercel project per client. Everything client-specific
is content, design tokens, or deployment identifiers — the component code,
content validation, image pipeline, and CMS schema carry over untouched.

> At 3+ clients, prefer a shared template repo (one codebase, per-client content/
> config branches or a content service) over diverging forks.

## What's client-specific

| Kind | Where |
| --- | --- |
| GitHub repo (Decap backend) | `public/admin/config.yml` → `backend.repo` |
| Vercel URL (OAuth origin) | `public/admin/config.yml` → `base_url`; `index.html` → `canonical`, `og:url`, `og:image`, `twitter:image` |
| Brand strings | `index.html` → `title`, `description`, `og:title`, `og:image:alt` |
| Package name | `package.json` → `name` |
| Design (color, fonts, …) | `src/styles/theme.css` tokens (design-system §8 runbook) |
| Content | `content/projects/*.json`, `content/profile.json` |
| Images | `public/images/projects/` |

## Steps

1. **Clone** this repo into the new client's working copy and create their GitHub repo; push.
2. **Repoint identity** (automates the table above except brand strings/tokens):
   ```bash
   node scripts/new-client.mjs --repo <owner/repo> --url <https://new.vercel.app> --name <pkg-name> [--reset-content]
   ```
   `--reset-content` clears `content/projects/*.json`, resets `content/profile.json` to valid
   placeholders, and empties `public/images/projects/`. (Tests that assert ≥1 project per
   category will fail until real content is added — expected for a fresh clone.)
3. **Vercel project**: import the new repo → confirm the production URL matches `--url`.
4. **GitHub OAuth App** (cannot be reused — one callback URL per App): create one with callback
   `https://<new-url>/api/callback`; add `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` to the new
   Vercel project's env vars. Invite the client as a repo collaborator.
5. **Content**: `node scripts/fetch-behance.mjs --profile <their-behance>` → copy its per-file
   output into `content/` and images into `public/images/projects/` → `npm run images`.
6. **Rebrand**: edit `src/styles/theme.css` tokens and the `index.html` brand strings.
7. **Verify**: `npm run lint && npm run check:tokens && npm run test && npm run test:scripts && npm run build`,
   then `npm run test:e2e`.
