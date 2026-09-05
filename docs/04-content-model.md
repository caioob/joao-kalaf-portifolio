# 04 — Content Model

`src/lib/projects.js` is the only repository that reads content. It validates the model below and supplies presentational components with ranked data. `src/lib/types.js` mirrors this vocabulary for editor tooling.

## Files

```
content/
├── profile.json
├── disciplines.json
├── projects/*.json
└── archive/projects/*.json
```

Only `content/projects/*.json` is production input. The archive is intentionally outside that glob, so archived work and its assets cannot ship accidentally.

## Localized values

All public-facing copy uses this object and requires both non-empty values unless the enclosing field is absent:

```json
{ "pt": "Português (Brasil)", "en": "English" }
```

## `profile.json`

```json
{ "name": "João Kalaf", "logo": "/images/logo.webp" }
```

| Field  | Required | Meaning                                                                                       |
| ------ | -------- | --------------------------------------------------------------------------------------------- |
| `name` | yes      | Public name in the hero and footer.                                                           |
| `logo` | no       | Optional public logo path. Its background treatment is a design token, not dashboard content. |

No bio, email, social, services, or contact data belongs here in v1.

## `disciplines.json`

This is the single ordered catalog file. Decap's list order is the editorial display order; its pre-save hook writes `rank` from that order and generates an immutable ID for a newly added item.

```json
{
  "disciplines": [
    {
      "id": "discipline-uuid",
      "label": { "pt": "Motion", "en": "Motion" },
      "rank": 1,
      "archived": false
    }
  ]
}
```

| Field      | Required | Rules                                                                                            |
| ---------- | -------- | ------------------------------------------------------------------------------------------------ |
| `id`       | yes      | System-generated stable ID; never repurpose it.                                                  |
| `label`    | yes      | Both languages.                                                                                  |
| `rank`     | yes      | Non-negative integer and unique; generated from catalog ordering.                                |
| `archived` | yes      | An archived discipline may not be referenced by any active project. Reassign all projects first. |

The public filter contains only active disciplines used as a project's primary discipline. Secondary disciplines never create a filter.

## Project

Each project is one `content/projects/*.json` document. Filenames are an implementation detail; the record has the immutable `id` and public `slug`.

```json
{
  "id": "project-uuid",
  "slug": "nome-do-projeto",
  "rank": 17,
  "primaryDisciplineId": "discipline-uuid",
  "secondaryDisciplineIds": ["discipline-uuid-2"],
  "title": { "pt": "Nome do projeto", "en": "Project name" },
  "description": { "pt": "Texto opcional.", "en": "Optional text." },
  "coverMediaId": "media-uuid",
  "media": [],
  "context": {
    "clientOrBrand": "Marca",
    "role": { "pt": "Direção de arte", "en": "Art direction" }
  },
  "tools": ["After Effects"],
  "links": [
    { "label": { "pt": "Ver projeto", "en": "View project" }, "url": "https://example.com" }
  ]
}
```

| Field                    | Required | Rules                                                                                                                      |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | yes      | System-generated, stable, unique, immutable.                                                                               |
| `slug`                   | yes      | System-generated from the initial PT-BR title, unique, lowercase kebab-case, immutable. Powers `#project/<slug>`.          |
| `rank`                   | yes      | João's unique global showcase position; lowest value is first. New projects receive a bottom rank.                         |
| `primaryDisciplineId`    | yes      | Must reference one active catalog item.                                                                                    |
| `secondaryDisciplineIds` | yes      | Ordered zero-or-more active catalog IDs; cannot repeat the primary discipline.                                             |
| `title`                  | yes      | PT-BR and EN.                                                                                                              |
| `description`            | no       | Optional as a whole; when present it must be complete in both languages. Plain text, with blank lines creating paragraphs. |
| `coverMediaId`           | yes      | Must point to an image in `media`; never to a video.                                                                       |
| `media`                  | yes      | Ordered non-empty gallery.                                                                                                 |
| `context`                | no       | Optional as a whole; when present client/brand and bilingual role are all required.                                        |
| `tools`                  | no       | Ordered non-empty free-text labels.                                                                                        |
| `links`                  | no       | Bilingual labels and HTTPS URLs only.                                                                                      |

### Gallery media

```json
{
  "id": "media-uuid",
  "type": "image",
  "src": "/images/projects/master.webp",
  "alt": { "pt": "Descrição da imagem", "en": "Image description" },
  "focalPoint": { "x": 50, "y": 35 },
  "width": 1600,
  "height": 1000
}
```

- Image `alt` is required in both languages. `focalPoint` is optional; when supplied `x` and `y` are percentages in the inclusive `0–100` range.
- Image `src` is a single canonical master. The build creates sibling responsive WebP variants; see [08](08-responsive-images.md).
- A video is `{ id, type: "video", provider, videoId, title }`. Supported providers are `youtube`, `vimeo`, and `adobe-ccv`; `title` is bilingual. Adobe CCV uses a full embed URL as `videoId`.

## Validation and preview

- Production validates every profile, discipline, project reference, localized field, cover, media item, and external URL. A violation throws and fails the build.
- Preview validates leniently so João can save an incomplete draft. Invalid projects are listed in `previewChecklist`; only structurally renderable projects appear in the preview grid.
- The production branch must have an empty `previewChecklist`. Tests assert this against the committed content.

## Archive and restore

To archive, move the project JSON to `content/archive/projects/` on `content-preview`, retain its images, and merge only after the normal gate. To restore, move it back to `content/projects/`, repair references if needed, and publish through a new PR. There is no permanent delete in v1.
