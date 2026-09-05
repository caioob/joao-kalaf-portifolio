# 05 — Roadmap

## Completed foundation

1. Static Vite/React showcase, tokenized design system, bilingual interface, responsive images, accessible detail dialog, and Vercel deployment.
2. Content moved into one JSON file per project under the content repository seam.
3. Behance importer, responsive WebP pipeline, vendored Decap workspace, GitHub OAuth proxy, and local CMS workflow.

The corresponding implementation reports remain in `docs/reports/`.

## Completed: protected portfolio authoring and showcase workflow

The current step implements the design recorded in issue #14 and in docs 01, 02, 04, 07, and 08:

1. Replace fixed categories and date/featured ordering with a dynamic ordered discipline catalog and João's showcase rank.
2. Replace standalone thumbnails with one cover-eligible gallery image, validated bilingual media, optional focal point, optional project context, and HTTPS links.
3. Keep a sharply scoped Profile area: public name and optional logo only.
4. Add primary-discipline filtering, project deep links, history-aware detail dialogs, and preview-blocker rendering.
5. Point Decap at `content-preview`, give it PT-BR forms, dynamic catalog relations, and pre-save normalization for IDs, slug, gallery cover, and optional bilingual objects.
6. Define the explicit protected-preview → reviewed PR → protected production release process and archive/recovery behavior.

**Exit criteria:** content validates strictly on production, a preview can preserve incomplete work with a visible checklist, public filters follow the catalog, no removed showcase fields leak back into the UI, and the full verification battery passes.

## Next operational step

Configure the external controls described in [07](07-admin-cms.md): create/protect `content-preview`, require PR checks on `main`, restrict Vercel previews, and verify an external reviewer can use then lose a share link. This needs GitHub/Vercel dashboard authority and is intentionally not encoded as application source.

## Future candidates

- Add a dedicated authoring workspace if João needs visual drag-and-drop rank changes across project files rather than the current explicit rank field.
- Add roles after the ownership/audit requirements are concrete; the content model intentionally does not encode an editor into projects.
- Consider leads and analytics as standalone systems only after they become an explicit business priority.
