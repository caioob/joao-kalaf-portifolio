# ADR 0001: Protected preview publication

**Status:** Accepted

## Context

The portfolio is reputationally sensitive, bilingual, and media-heavy. João needs to save incomplete work without exposing it publicly, while v1 has one editor and no need for a database or per-record drafts.

## Decision

Use one stable `content-preview` branch for Decap saves and Vercel review deployments. Treat `main` as protected production. Publish a reviewed batch through a GitHub pull request from `content-preview` to `main` after strict validation, build checks, and João's final review attestation.

Preview mode permits saved incomplete projects and surfaces their blockers. Production mode rejects any invalid content. Archived projects are moved outside the production-input glob and restored through the same branch and gate.

## Consequences

- The workflow has one clear review location and one auditable merge action.
- Content remains Git-backed and the public site remains fully static.
- GitHub branch protection and Vercel preview restriction are required operational configuration, not repository code.
- A saved preview is not a public release, and a release cannot cherry-pick an individual project from an incomplete batch.
