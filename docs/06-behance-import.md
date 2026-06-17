# 06 — Behance Import Script

A one-time-use CLI tool that dumps a Behance profile's projects and metadata into the portfolio's data format, staging results for human review before merging into `src/data/`.

## 1. Script location and invocation

```
scripts/fetch-behance.mjs
```

```bash
# Basic — uses default profile
node scripts/fetch-behance.mjs

# With arguments
node scripts/fetch-behance.mjs --profile=https://www.behance.net/someuser/

# With env var
BEHANCE_PROFILE=https://www.behance.net/someuser/ node scripts/fetch-behance.mjs

# Debugging — visible browser, custom output dir
node scripts/fetch-behance.mjs --headless=false --output=./my-dump
```

### CLI arguments

| Argument | Env var | Default | Description |
|---|---|---|---|
| `--profile` | `BEHANCE_PROFILE` | `https://www.behance.net/joaokalaf/` | Behance profile URL to scrape |
| `--output` | `BEHANCE_OUTPUT` | `scripts/behance-dump/` | Staging output directory |
| `--lang` | `BEHANCE_LANG` | `pt` | Source language of Behance content (used for TRANSLATE markers) |
| `--headless` | — | `true` | Run Playwright headless; set `false` for debugging |

Priority: CLI argument > env var > hardcoded default.

## 2. Dependencies

Add as devDependencies (not runtime — this is a build tool):

- `playwright` — headless browser automation, handles DataDome/Cloudflare and JS rendering
- `sharp` — image resize + AVIF/WebP conversion (shared with the build-time ladder, doc 08)

These are **not** runtime dependencies of the portfolio site. They do not affect the build budget or the zero-deps constraint.

## 3. Extraction strategy

Behance is a JavaScript SPA behind anti-bot protection (DataDome / Cloudflare). Traditional HTTP scraping fails. The script uses Playwright to:

1. Launch a Chromium browser (headless by default)
2. Navigate to the profile URL
3. Wait for content to render
4. Extract data from the page

### 3.1 Primary: `be-state` script tag

Behance pages embed a `<script id="be-state">` tag containing a pre-rendered JSON object of the page's data. This is the richest and most reliable source — it includes project metadata, user info, image URLs, and creative fields, all in structured JSON without needing to parse HTML.

```
page.evaluate(() => JSON.parse(document.getElementById('be-state').textContent))
```

### 3.2 Fallback: Network interception

If `be-state` is missing or incomplete (Behance sometimes strips it), intercept network responses from `api.behance.net` during page load. These internal API calls return structured JSON. Register a route handler before navigation:

```
page.route('**/api.behance.net/**', handler)
```

Collect all matching responses and merge them as the data source.

### 3.3 Deep project pages

The profile page lists projects with summary data. For full details (all media modules, tools, description), the script must visit each individual project page. It does this sequentially with a configurable delay (default: 2 seconds between requests) to respect rate limits.

### 3.4 Infinite scroll

The profile page uses infinite scroll. The script scrolls to the bottom repeatedly until no new projects load, collecting project links as it goes, before visiting each project detail page.

## 4. Data mapping

### 4.1 Profile — Behance user → `Profile` schema

| Behance field | Portfolio field | Transformation |
|---|---|---|
| `user.display_name` | `name` | As-is |
| `user.sections[BIO_SECTION]` | `bio` | `{ pt: text, en: "TRANSLATE:" + text }` |
| — | `tagline` | Derived from first sentence of bio, or `"TRANSLATE:"` placeholder |
| `user.sections` | `services` | Generate 4 entries from the category enum. Blurbs are placeholders pending client input. |
| — | `email` | Empty string — not available on Behance |
| `user.social_links` | `socials` | Map Behance/Instagram/LinkedIn/etc. URLs from profile |
| — | `photo` | `null` — profile image download optional, not in schema scope |

### 4.2 Project — Behance project → `Project` schema

| Behance field | Portfolio field | Transformation |
|---|---|---|
| Auto-increment | `id` | `p-001`, `p-002`, … assigned in sort order |
| URL slug | `slug` | Kebab-case from Behance project URL |
| Creative fields + tags | `category` | Heuristic (see §4.3) |
| `name` | `title` | `{ pt: name, en: "TRANSLATE:" + name }` |
| `description` | `description` | `{ pt: desc, en: "TRANSLATE:" + desc }` |
| Cover image | `thumbnail` | Download → 16:10 WebP → `/images/projects/{slug}-thumb.webp` |
| Project modules | `media[]` | See §4.4 |
| `tools` | `tools` | Array of tool name strings, as-is |
| `published_on` (timestamp) | `date` | Convert to `YYYY-MM` |
| — | `featured` | `false` for all (human decides) |
| Project URL | `links[]` | One link: `{ label: { pt: "Ver no Behance", en: "View on Behance" }, url: PROJECT_URL }` |

### 4.3 Category heuristic

Behance uses many creative field labels. Map them to the portfolio's 4-category enum:

| Behance creative field (contains) | Portfolio category |
|---|---|
| `video editing`, `film`, `video production`, `documentary` | `video` |
| `motion design`, `animation`, `after effects`, `motion graphics`, `3d animation` | `motion` |
| `ui/ux`, `product design`, `interaction design`, `ux design`, `ui design`, `app design` | `product` |
| `graphic design`, `branding`, `illustration`, `typography`, `print design`, `visual identity`, `poster design`, `packaging` | `graphic` |
| *No match* | `graphic` (default) — flag in `_review.json` |

Matching is case-insensitive substring. The script checks each project's creative fields array against the table above; first match wins. If no field matches any row, the project gets `graphic` and is flagged for human review.

### 4.4 Media modules

Behance projects contain modules — image blocks, video embeds, and text blocks.

| Module type | Portfolio media | Transformation |
|---|---|---|
| Image module | `{ type: "image", src: "/images/projects/{slug}-{n}.webp", alt: { pt: project name, en: "TRANSLATE:" + project name } }` | Download, convert to WebP. Alt text defaults to project name (better than nothing). |
| Video embed (YouTube) | `{ type: "video", provider: "youtube", videoId: ID, title: { pt: project name, en: "TRANSLATE:" + project name } }` | Extract video ID from embed URL. Use `youtube-nocookie.com` format in the portfolio, but store bare ID. |
| Video embed (Vimeo) | `{ type: "video", provider: "vimeo", videoId: ID, title: { pt: project name, en: "TRANSLATE:" + project name } }` | Extract video ID from embed URL. |
| Text block | *Skipped* | Not a media type in the portfolio schema. |
| Embedded player (other) | *Skipped* — flag in `_review.json` | Unsupported provider. |

### 4.5 i18n: TRANSLATE markers

Behance content is assumed to be in the language specified by `--lang` (default: `pt`). The script:

- Puts the real text in the `{ --lang }` field
- Puts `"TRANSLATE:" + originalText` in the other field
- Human can grep for `TRANSLATE:` to find all untranslated fields

Example:

```json
{
  "title": { "pt": "Identidade Visual — Café Aurora", "en": "TRANSLATE:Identidade Visual — Café Aurora" }
}
```

## 5. Image handling

### 5.1 Download

- Thumbnails: each project's cover/original image
- Gallery: each image-type module in the project

All images are downloaded to the output directory during scraping, then converted.

### 5.2 Conversion with sharp — same high-res strategy as the rest of the pipeline

The importer is **not** a special low-res path. It feeds the **shared image module** that also serves the Decap upload flow, so Behance-sourced images get the identical responsive treatment specified in `docs/08-responsive-images.md` (AVIF + WebP, the per-slot width ladder, intrinsic dimensions). The dump and the CMS are two callers of one optimizer.

- **Canonical master (committed):** one WebP per image — `{slug}-thumb.webp` (16:10 cover crop, top thumbnail width) and `{slug}-{n}.webp` (gallery, top width, aspect preserved). This is the `src` stored in the JSON, exactly as before, just at the ladder's top width (gallery up to 2560px, `withoutEnlargement`).
- **Derived ladder (build-time):** the smaller widths + every AVIF variant are produced by the shared step at build (`docs/02-architecture.md` §7), not committed — same policy for dump-sourced and CMS-sourced images. For local preview after a dump, `npm run images` runs the same step against the working tree.
- **Intrinsic dimensions:** the importer records each master's `width`/`height` into the `Image` record (doc 04) so components reserve space (no CLS).
- Output filenames: `{slug}-thumb.webp` / `{slug}-{n}.webp` (1-indexed, module order) for the canonical masters; derived variants follow the `…-<width>.{avif,webp}` convention in doc 08 §3.

### 5.3 Path rewriting

The JSON files reference images using the portfolio's public path convention:

```json
{ "src": "/images/projects/campanha-verao-thumb.webp" }
```

After review, images are copied from the staging dir to `public/images/projects/`.

## 6. Output structure

```
{output-dir}/
  profile.json          # Portfolio-format Profile object (ready for src/data/)
  projects.json         # Portfolio-format Project[] array (ready for src/data/)
  images/               # Downloaded + converted images
    {slug}-thumb.webp
    {slug}-1.webp
    ...
  _review.json          # Flags and warnings for human review
  _raw/                 # Raw scraped data for debugging
    profile-raw.json
    projects-raw.json
```

### `_review.json` format

```json
{
  "profileUrl": "https://www.behance.net/joaokalaf/",
  "scrapedAt": "2026-06-17T15:00:00Z",
  "projectCount": 12,
  "warnings": [
    {
      "projectId": "p-005",
      "slug": "my-project",
      "field": "category",
      "message": "No matching creative field; defaulted to 'graphic'",
      "behanceFields": ["Architecture", "3D Art"]
    }
  ],
  "untranslatedFields": 24,
  "missingImages": 0,
  "skippedModules": [
    { "projectId": "p-003", "slug": "some-project", "moduleIndex": 2, "type": "embed", "reason": "Unsupported provider: Dailymotion" }
  ]
}
```

## 7. Post-run human workflow

After the script completes:

1. **Review `_review.json`** — check warnings, fix any incorrect category defaults, note skipped modules
2. **Fix categories** — open `projects.json`, correct any `category` values that the heuristic got wrong
3. **Translate** — grep for `TRANSLATE:` across both JSON files and fill in the English translations
4. **Write alt text** — image alt defaults to the project name; improve if desired
5. **Complete profile** — fill in `email` (not available from Behance), verify `socials`, write `tagline`
6. **Copy data** — `cp projects.json src/data/projects.json && cp profile.json src/data/profile.json`
7. **Copy images** — `cp images/*.webp public/images/projects/`
8. **Verify** — `npm run lint && npm run check:tokens && npm run test && npm run build`

## 8. Error handling

- **Anti-bot block**: If Playwright hits a DataDome challenge page (detected by page content or HTTP 403), the script exits with a clear message suggesting `--headless=false` or waiting and retrying. It does **not** attempt CAPTCHA bypass.
- **Missing be-state**: Falls back to network interception (§3.2). If both fail, exits with error.
- **Partial data**: If a project page fails to load, skip it and log in `_review.json`. Don't abort the entire run.
- **Image download failure**: Log warning, set `thumbnail.src` to the remote Behance CDN URL as a fallback, flag in `_review.json`.
- **Network errors**: Retry up to 3 times with exponential backoff (1s, 2s, 4s) per request.

## 9. Rate limiting and ethics

- 2-second delay between project page visits (respecting Behance's servers)
- Only scrapes the specified user's **own** profile and projects (first-party data)
- Does not scrape search results, other users' profiles, or comments
- Downloads images only for the user's own portfolio (their own creative work)
- No API key or authentication bypass required — the script reads publicly rendered pages

## 10. Script structure

```
scripts/fetch-behance.mjs       # Entry point: parse args, orchestrate pipeline
scripts/lib/behance-scrape.mjs  # Playwright logic: navigate, extract be-state, scroll, visit projects
scripts/lib/behance-map.mjs     # Data mapping: Behance JSON → portfolio schema
scripts/lib/behance-images.mjs  # Download + sharp conversion
scripts/lib/behance-write.mjs   # Write output JSON + _review.json + _raw/
```

Each module exports pure functions for testability. The entry point wires them together.

## 11. Reusability

The script is designed for reuse across different Behance portfolios:

- `--profile` / `BEHANCE_PROFILE` makes the target configurable
- `--lang` adapts the TRANSLATE marker language (e.g. `--lang=en` for an English-speaking designer)
- `--output` isolates each run's data
- Category heuristic table is a simple data structure in `behance-map.mjs` — extend it for new creative fields without touching logic
- No hardcoded user-specific values in the scraping or mapping code
