# 07 — Admin CMS and Publication Workflow

Decap is a static, PT-BR editing workspace at `/admin/index.html`. It is deliberately separate from the public React application and commits content to Git through the GitHub backend.

## Branch model

```
João → Decap save → content-preview → restricted Vercel preview
                                      ↓
                        final review + publication gate
                                      ↓
                      pull request → protected main → production
```

- Decap's configured backend branch is `content-preview`; it must be created before first production use.
- `main` is production-only and must require a pull request, passing checks, and João's final review attestation before merge.
- Vercel must restrict preview deployments by default. A reviewer gets one authenticated, revocable Vercel share link; they do not need GitHub or Vercel membership.
- GitHub and Vercel access controls are external settings, not secrets stored in this repository.

## CMS workspace

`public/admin/config.yml` exposes exactly three Portuguese collections:

| Collection      | Purpose                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Projetos**    | Create and edit the bilingual showcase records and ordered media gallery.                                      |
| **Disciplinas** | Maintain the one ordered `content/disciplines.json` catalog; archive only after projects have been reassigned. |
| **Perfil**      | Edit the public name and optional logo only.                                                                   |

The Project form supports primary and optional secondary discipline relations from the dynamic catalog, bilingual title/narrative/alt/video/link labels, client or brand plus role, tools, ordered images and approved hosted video embeds. Image items include a single “use as cover” selection and optional focal point.

`public/admin/editorial.js` registers Decap's `preSave` event hook. It:

- generates immutable project, media, and discipline IDs;
- derives a kebab-case slug once from the PT-BR title;
- keeps a new project's rank at the bottom unless João supplies a position;
- assigns catalog ranks from the list order;
- turns a selected gallery image into `coverMediaId` and rejects zero or multiple covers;
- removes empty optional description/context objects and rejects incomplete bilingual optional objects.

The browser-side hook is editor assistance, not the security boundary. `src/lib/projects.js` repeats the important constraints during preview and production builds.

## Save, preview, and publish

1. João saves changes in Decap. They commit to `content-preview` and receive the corresponding Vercel preview.
2. The preview may show a small status checklist. João completes every missing translation, alt text, reference, media, and URL requirement.
3. João performs final review in the restricted preview and records the attestation in a PR from `content-preview` to `main`.
4. The PR gate runs the repository verification commands and Vercel build. It is all-or-nothing: any blocker holds the whole batch.
5. João merges the protected PR. `main` deploys to production.

Decap does not create the release pull request itself. The explicit GitHub PR is intentional: it is the final, auditable publication control rather than a second draft state inside the CMS.

## Local editing

For a local workspace, checkout `content-preview`, then run:

```bash
npm run dev-local
```

Open `http://localhost:5173/admin/index.html`. The local Decap proxy edits the working tree, so it does not round-trip through GitHub. Commit to `content-preview` after reviewing the local preview and verification results.

## Archive and recovery

Decap disables destructive project deletion. Archive uses the reversible file move described in [04](04-content-model.md), completed on `content-preview`; restore is the reverse move. A historical recovery or production revert is performed through a protected pull request, never a direct write to `main`.

## Operational setup checklist

- Create and protect `content-preview` and protect `main`.
- Configure Vercel previews as restricted and confirm the external reviewer link can be revoked.
- Confirm the GitHub OAuth app and Vercel environment values used by `/api/auth` and `/api/callback` exist; do not commit credentials.
- Add João as the only editor/collaborator in v1.
- On the first publication, review mobile and desktop, PT-BR and EN, all deep links, all video embeds, and the generated responsive images.
