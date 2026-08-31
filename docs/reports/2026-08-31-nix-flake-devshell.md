# Report — Nix flake dev shell (Issue #1)

**Date:** 2026-08-31
**Scope:** [Issue #1](https://github.com/caioob/joao-kalaf-portifolio/issues/1) — a Nix flake providing a reproducible, cross-platform dev shell with turnkey Playwright.
**Status:** ✅ Complete. All six verification gates pass inside `nix develop` on `x86_64-linux`. macOS (`aarch64-darwin`) shares the same nixpkgs attributes and is expected to behave identically.

## 1. What was delivered

| Area                | Delivered                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flake               | `flake.nix` at repo root — `devShells.<system>.default` for `x86_64-linux`, `aarch64-linux`, `aarch64-darwin`                                                                                                                 |
| Lockfile            | `flake.lock` pins `nixpkgs` `nixos-unstable` to rev `34ab9907` (nar hash `sha256-hn1oU…`) for reproducible toolchains across machines                                                                                          |
| Toolchain in shell  | `nodejs_22` (Node 22 LTS, matching `package-lock.json` `engines` `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0`) and `librsvg` (`rsvg-convert` for `npm run og:image`)                                                                  |
| Playwright (turnkey) | `shellHook` exports `PLAYWRIGHT_BROWSERS_PATH` → nixpkgs `playwright.browsers` linkFarm (`chromium-1228`, `chromium_headless_shell-1228`, …). No `npx playwright install`, no `LD_LIBRARY_PATH` — nixpkgs' chromium is auto-patched to find its libs. |
| Git hygiene         | `.gitignore` gains `result` and `result-*` (nix build symlinks)                                                                                                                                                               |
| Docs                | README "Local development" quick-start (leads with `nix develop`); [architecture §6](../02-architecture.md) tooling paragraph synced to mention the flake                                                                      |

Additive only: **no application source touched** — `flake.nix`, `flake.lock`, `.gitignore`, `README.md`, and `docs/02-architecture.md`. The zero-runtime-deps policy and the `< 150 kB` budget are unaffected (the flake is dev-only tooling).

## 2. Verification results

Run inside the flake shell: `nix develop .#default -c bash -c 'npm ci && npm run lint && npm run check:tokens && npm run test && npm run test:scripts && npm run build && npm run test:e2e'` (system: `x86_64-linux`).

| Check      | Command                | Result                                                |
| ---------- | ---------------------- | ----------------------------------------------------- |
| Lint       | `npm run lint`         | ✅ clean                                              |
| Token rule | `npm run check:tokens` | ✅ no raw visual values outside `theme.css`            |
| Tests      | `npm run test`         | ✅ 75/75                                              |
| Script tests | `npm run test:scripts` | ✅ 113/113                                          |
| Build      | `npm run build`        | ✅ JS 71.69 kB gzip (budget: < 150 kB), CSS 5.30 kB gzip |
| E2E (canary) | `npm run test:e2e`   | ✅ 8/8 — headless Chromium launches from `PLAYWRIGHT_BROWSERS_PATH`, no `LD_LIBRARY_PATH` |

`test:e2e` is the load-bearing canary: it's the assertion that proves the turnkey Playwright integration end-to-end and the one that breaks if the npm `playwright` browser revision drifts from nixpkgs' bundled browsers.

## 3. Deviations from spec (docs already synced)

1. **New top-level tooling file not enumerated in architecture §2's folder structure.** The flake sits at the repo root alongside `package.json` and `index.html`. Updated [architecture §6](../02-architecture.md) with a "Reproducible dev shell" bullet describing the flake, the turnkey Playwright integration, and the drift maintenance note. The §2 folder tree is intentionally not redrawn — it documents `src/`-side structure, and a root-level tooling file doesn't belong there.
2. **No README quick-start existed.** The spec's updated story #2 asked for setup steps on the README. Added a "Local development" section that leads with the `nix develop` fast path, lists the verification commands, notes the Intel-Mac exclusion, and keeps a brief unsupported manual route for non-Nix users.

## 4. Issues found & fixed

- **`nix flake lock` refused to run on an untracked `flake.nix`.** Flakes ignore untracked files. Fixed by `git add flake.nix .gitignore` before locking — documented in the spec's implementation decisions ("Flake files must be Git-tracked"). No code change; the committed files are staged normally.
- **(Resolved during exploration, recorded for the next maintainer) Playwright browser-version coupling.** The npm `playwright` package reports `1.61.0` and nixpkgs reports `1.61.1`, but both bundle chromium **revision 1228** (browserVersion 149.0.7827.55) — the patch mismatch is harmless; the browser-revision match is what the driver checks. If a future `nix flake update` bumps nixpkgs' revision, `test:e2e` will fail to find the expected browser directory; realign the npm package to nixpkgs' version. Documented inline in `flake.nix` and in [architecture §6](../02-architecture.md).

## 5. Decisions of record

- **Turnkey nixpkgs Playwright over `makeLibraryPath` + npm-downloaded Chromium.** Chose option 2 (nixpkgs' `playwright.browsers` linkFarm via `PLAYWRIGHT_BROWSERS_PATH`) over option 1 (`lib.makeLibraryPath` + `LD_LIBRARY_PATH` around a downloaded Chromium). Pro: zero browser download, no `LD_LIBRARY_PATH`, identical browser across Linux/macOS. Con: the npm `playwright` version is coupled to nixpkgs' bundled browser revision (the fragile seam, above). The coupling was accepted because both versions currently align and the failure mode is loud (`test:e2e` can't find browser) with a one-step remedy.
- **`nixos-unstable` input, not a pinned release.** Playwright's nixpkgs build tracks recent Chromium revisions; a stable channel pin would lag and force a version mismatch sooner. `flake.lock` still pins the exact rev for reproducibility; `nix flake update` is an explicit, reviewable action.
- **No `checks.<system>` flake output / `nix flake check` codification.** Deferred (out of scope per spec). It would require running `npm ci` during the nix build — npm-registry access in the sandbox needs a `fetchNpmDeps`/`buildNpmPackage` codification with its own reproducibility tradeoffs. The manual `nix develop … -c …` battery is sufficient and is what this report ran.
- **No `.envrc` (direnv) provided.** Not requested; users enter the shell explicitly via `nix develop`. A contributor can add `use flake` to a `.envrc` later without flake changes.
- **Intel Mac (`x86_64-darwin`) excluded.** nixpkgs ships no Playwright chromium binary for it. Documented in the flake comment, the README, and architecture §6. Intel Mac users should use Rosetta 2 + the `aarch64-darwin` shell or a different machine.

## 6. Next steps

- **macOS verification (by a contributor on Apple Silicon).** nixpkgs provides the same `nodejs_22`, `librsvg`, and `playwright.browsers` attributes on `aarch64-darwin`, so the flake evaluates and is expected to behave identically — but the battery in this report was run on `x86_64-linux`. An on-Mac run of the six gates would close the loop.
- **Optional hardening:** codify the battery as a `checks.<system>` output so `nix flake check` gates it in CI (deferred per spec; needs npm-in-nix-build sandbox handling).
- **Optional DX:** add a `.envrc` with `use flake` for contributors who want automatic shell activation via direnv.
