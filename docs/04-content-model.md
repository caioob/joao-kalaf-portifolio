# 04 — Content Model

All schemas below are the single source of truth: the v1 JSON files, the repository validation in `src/lib/projects.js`, and the v2 admin form fields all derive from them.

## 1. `Project`

Stored in `src/data/projects.json` as an array. Order in the file doesn't matter — the repository sorts by `date` descending.

| Field         | Type         | Required | Notes                                                                                                                         |
| ------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string       | ✓        | Stable unique id, e.g. `"p-001"`. Never reused after deletion.                                                                |
| `slug`        | string       | ✓        | Kebab-case, unique, e.g. `"campanha-verao-2026"`. Used in share URLs later.                                                   |
| `category`    | enum         | ✓        | One of `"video" \| "motion" \| "product" \| "graphic"` — the canonical enum, exported as `CATEGORIES` from `lib/projects.js`. |
| `title`       | `{ pt, en }` | ✓        | Both languages required.                                                                                                      |
| `description` | `{ pt, en }` | ✓        | 1–3 short paragraphs; plain text, `\n\n` = paragraph break.                                                                   |
| `thumbnail`   | `Image`      | ✓        | Shown on the grid card. 16:10 crop, ≥ 1200 px wide, WebP.                                                                     |
| `media`       | `Media[]`    | ✓ (≥ 1)  | Gallery shown in the detail modal, in array order.                                                                            |
| `tools`       | string[]     | –        | e.g. `["After Effects", "Figma"]`. Display names, free text.                                                                  |
| `date`        | string       | ✓        | `"YYYY-MM"`. Drives sort order and the displayed year.                                                                        |
| `featured`    | boolean      | –        | Default `false`. Featured cards may be emphasized on the grid.                                                                |
| `links`       | `Link[]`     | –        | External: live site, full video, Behance case, etc.                                                                           |

### `Image`

```jsonc
{ "src": "/images/projects/campanha-verao-thumb.webp", "alt": { "pt": "...", "en": "..." } }
```

`alt` is **required** in both languages — accessibility is enforced at the schema level.

### `Media` (tagged union on `type`)

```jsonc
{ "type": "image", "src": "...", "alt": { "pt": "...", "en": "..." } }
{ "type": "video", "provider": "youtube" | "vimeo", "videoId": "dQw4w9WgXcQ", "title": { "pt": "...", "en": "..." } }
```

Videos are stored as provider + id (never raw iframe HTML) — the `ProjectDetail` component builds a privacy-friendly lazy embed (`youtube-nocookie.com`, vimeo `dnt=1`).

### `Link`

```jsonc
{ "label": { "pt": "Ver no Behance", "en": "View on Behance" }, "url": "https://..." }
```

### Validation (enforced by `lib/projects.js` on load)

- Unique `id` and `slug`; `category` ∈ enum; `date` matches `^\d{4}-\d{2}$`.
- Every `{ pt, en }` field has both keys non-empty.
- `media` non-empty; every image has `alt`; every video has `provider` + `videoId`.
- Dev: invalid record throws with a message naming the `id` and field. Prod build: record is skipped with a console warning.

## 2. `Profile`

Stored in `src/data/profile.json` (single object).

| Field      | Type               | Notes                                                                                                                                      |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`     | string             | Display name / brand. **Pending** (README checklist).                                                                                      |
| `tagline`  | `{ pt, en }`       | One sentence under the hero name.                                                                                                          |
| `bio`      | `{ pt, en }`       | 2–3 paragraphs for the About section.                                                                                                      |
| `services` | `Service[4]`       | Exactly four: `{ id: category-enum value, name: {pt,en}, blurb: {pt,en} }`. Reuses the category enum so services and filters stay aligned. |
| `email`    | string             | Contact CTA target.                                                                                                                        |
| `socials`  | `{ label, url }[]` | Behance, Instagram, LinkedIn, Vimeo…                                                                                                       |
| `photo`    | `Image` \| null    | Optional About-section portrait.                                                                                                           |

## 3. UI string dictionaries

`src/i18n/pt.json` and `en.json` — flat keys, identical key sets (a test asserts parity):

```jsonc
{
  "nav.work": "Trabalhos",
  "nav.about": "Sobre",
  "nav.contact": "Contato",
  "filter.all": "Todos",
  "filter.video": "Vídeo",
  "filter.motion": "Motion",
  "filter.product": "Produto",
  "filter.graphic": "Gráfico",
  "work.empty": "Nenhum projeto nesta categoria ainda.",
  "work.showAll": "Ver todos",
  "detail.tools": "Ferramentas",
  "detail.close": "Fechar",
  "contact.cta": "Vamos conversar",
  // ... final list grows during implementation; keys never hold content, only UI copy
}
```

**Rule of thumb:** if the text describes _the designer or their work_ → it's content (`{pt,en}` in data JSON). If it describes _the interface_ → it's a dictionary key.

## 4. Adding a project in v1 (manual workflow)

Written so the designer can do it with light guidance:

1. Export a thumbnail at 1600×1000 (16:10) as WebP → drop into `public/images/projects/`.
2. Open `src/data/projects.json`, copy the last project object, paste it at the top.
3. Fill in every field (new `id`, new `slug`, both `pt` and `en` texts, correct `category` and `date`).
4. Run `npm run dev` — if anything is malformed, the page shows a clear validation error naming the field.
5. Commit & push → host auto-deploys.

This same field list, in the same order, becomes the v2 admin form — meaning v2 changes _where_ the data lives, never _what_ it looks like.
