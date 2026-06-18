# 2026-06-17 — Decap → image pipeline wiring + content guard (v2 Step 5)

Roadmap: [05 — v2 Step 5](../05-roadmap.md). The final v2 step: make CMS image uploads flow through the responsive pipeline, and guard content validity. Completes the admin loop — a non-technical client can add a project with a raw photo and get an optimized, responsive result.

## Delivered

- **Upload normalization in the generator** (`scripts/generate-images.mjs`). For every master referenced by `content/`, it now ensures a **canonical WebP** master exists — converting + capping a CMS upload of *any* format (jpg/png/…) to the slot's ceiling (thumbnail 1600×1000 cover, gallery ≤2560, portrait ≤960) — records intrinsic `width`/`height` back into the JSON, and writes the WebP ladder. Idempotent: already-normalized masters are a no-op, so a Decap upload only generates its own files on deploy.
- **Format-aware frontend** (`src/lib/images.js`). New `canonicalSrc()` maps any src to its WebP form; `variantSrc`/`srcSetFor` and `ResponsiveImage` use it, so a not-yet-normalized upload still resolves to the optimized WebP.
- **Content guard** (`src/lib/content.test.js`). Asserts every `content/projects/*.json` and `content/profile.json` passes **strict** validation — a half-translated required field or a missing image fails the suite, naming the record.
- **Description validation relaxed** (`src/lib/projects.js`, landed earlier in `f6952b7`). A one-language description is now valid copy instead of a build-breaker — see "Issues" below.

## Verification

| Check | Result |
| --- | --- |
| `npm run images` on existing content | **0 normalized, 0 rewrites** — does not disturb the 15 committed projects |
| Upload path (synthetic 3000×2000 JPEG) | → capped **2560×1707 WebP** master, JSON rewritten (`src`→`.webp` + dims), ladder `-640/-1280/-1920` generated |
| `npm run test` | 75 pass (+`canonicalSrc`, +content guard) |
| `npm run lint` / `check:tokens` / `test:scripts` | pass / pass / 113 |
| `npm run test:e2e` | 8/8 — `canonicalSrc` change didn't regress rendering |
| `npm run build` | pass (generator runs first, idempotent no-op) |

## Issues found & fixed (during Step 3 local testing)

- **A one-language description blanked the page.** Editing only the PT description produced `{pt:"…", en:""}`, which the strict "both-or-neither" rule rejected → dev threw, prod would silently skip the project. Relaxed to accept any pt/en combination (`pick()` falls back); required fields (title/alt) stay both-required and are enforced by Decap. Regression tests added.

## Decisions of record

- **Build-time normalization, not committed back.** The generator normalizes into the build output on Vercel (raw upload stays in git until a dev runs `npm run images` and commits to "bake" it). Keeps the client's commit simple; the deploy self-heals.
- **Uploads are capped, not just converted** — a 3000×4000 phone photo becomes a ≤2560 WebP + ladder, so a client can't ship a multi-MB original.

## Limitations / future

- A raw upload sits in git (alongside its generated WebP) until baked via `npm run images`; harmless but slightly redundant.
- `id` is still a manual field for new projects (no auto-increment).
- Optional: a CI step running the content guard on push would catch a bad client edit before deploy (today it's a dev/local guard; prod build is non-strict and skips bad records).

## v2 status

Steps 1–5 complete. The client can edit/add projects via `/admin` (GitHub login, Step 4), uploads are optimized + responsive, and content is guarded. Remaining is operational (client onboarding, real bio/translations) — see README "pending input".
