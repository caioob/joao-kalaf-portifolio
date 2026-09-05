# Report — Protected Portfolio Authoring

**Date:** 2026-09-05
**Scope:** [Roadmap: protected portfolio authoring and showcase workflow](../05-roadmap.md).
**Status:** Complete in repository. External GitHub/Vercel protection setup remains an operational handoff.

## 1. What was delivered

| Area            | Delivered                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content         | Migrated the 15 live project documents to immutable IDs/slugs, rank, primary/secondary discipline references, cover-selected gallery media, optional context, and bilingual validation. Added the ordered discipline catalog and archive input boundary. |
| Repository      | Replaced the static category/date/featured model with catalog-aware strict/preview validation, publication blockers, HTTPS link checks, focal-point checks, dynamic visible filters, and archive-safe loading.                                           |
| Public showcase | Dynamic primary-discipline filtering, history-aware `#project/<slug>` dialogs, cover rendering from gallery media, optional logo, project context, and preview checklist. Removed the old public showcase fields.                                        |
| CMS             | A PT-BR Decap configuration targeting `content-preview`, catalog relation fields, bilingual project/media fields, and a pre-save normalizer for IDs, slug, cover selection, optional objects, and catalog ranks.                                         |
| Media           | Updated the responsive image generator so a selected gallery cover receives both thumbnail and gallery variants. The build added 33 missing committed variants.                                                                                          |
| Documentation   | Replaced product, architecture, model, roadmap, CMS, image, README, and agent guidance with the release workflow; added the domain context and ADR.                                                                                                      |

## 2. Verification results

| Check                  | Result                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run lint`         | Pass                                                                  |
| `npm run check:tokens` | Pass                                                                  |
| `npm run test`         | Pass — 51 tests                                                       |
| `npm run test:scripts` | Pass — 113 tests                                                      |
| `npm run build`        | Pass — 73.39 kB gzip JavaScript; image pipeline generated 33 variants |
| `npm run test:e2e`     | Pass — 8 browser checks against `vite dev`                            |

## 3. Deviations from the requested experience

Decap's folder-collection interface can edit the unique numeric showcase rank but cannot atomically drag a project across separate JSON documents. The repository therefore honors João's global rank and new-project-bottom behavior, while a dedicated cross-project drag-and-drop workspace remains a future enhancement. This limitation is recorded in [the roadmap](../05-roadmap.md) rather than hidden behind a misleading control.

The repository defines and documents the `content-preview` → protected PR → restricted Vercel preview process, but branch protection, restricted deployment access, external reviewer sharing, and GitHub OAuth secrets require dashboard authority and were not changed from source.

## 4. Issues found and fixed

- Preview renderability initially received the catalog lookup map rather than its array, which surfaced during the full test suite. The helper contract now receives catalog records and rejects malformed primary-discipline references before a card can render.
- The prior image generator expected a separate thumbnail. It now processes the selected gallery cover in the thumbnail slot and every image in gallery slot.

## 5. Decisions of record

- One protected preview branch and batch PR publication; no persisted per-project drafts.
- A cover is a gallery image, not a separate upload.
- Public discipline filters derive only from active primary-discipline assignments.
- Archive is reversible by moving records outside production input; v1 has no permanent delete.

## 6. Next steps

1. Create and protect `content-preview`, protect `main`, and configure restricted Vercel previews as specified in [07](../07-admin-cms.md).
2. Add the final logo asset/background treatment and conduct the first restricted bilingual review.
3. If rank drag-and-drop is needed before launch, build a dedicated workspace that can update all affected project files in one action.
