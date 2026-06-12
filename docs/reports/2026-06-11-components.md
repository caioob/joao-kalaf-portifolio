# Report — Component Set (Roadmap v1, Step 5)

**Date:** 2026-06-11
**Scope:** [Roadmap §v1 step 5](../05-roadmap.md) — the full component inventory from [design §5](../03-design-system.md), turning the placeholder hero into the complete one-pager.
**Status:** ✅ Complete. All checks green. Paused for user review before step 6 (polish).

## 1. What was delivered

| Area         | Delivered                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter state | `src/lib/categoryFilter.js` — pure `parseCategoryFromHash()` + `useCategoryFilter()` (`useSyncExternalStore` on `hashchange`). Filters live in the URL (`#work/motion`), so filtered views are shareable (FR-1)                                                                                                                                                                                                                       |
| Components   | All 9 from the inventory: `LanguageToggle` (PT/EN segments, `aria-pressed`), `Navbar` (sticky, blur, border-on-scroll), `Hero` (name/roles/tagline/CTA), `FilterBar` (5 pills, accent underline), `ProjectCard` (lazy 16:10 thumbnail, category chip, year, play glyph, featured dot), `ProjectDetail` (modal), `ServiceList` (01–04), `ContactSection` (editorial line, `mailto:` CTA, socials), `Footer` (copyright, second toggle) |
| Modal        | Native `<dialog>` + `showModal()` — focus trap, Esc, inert background and focus-return come from the platform. Overlay-click close via target check; body scroll lock; privacy-friendly embeds (`youtube-nocookie.com`, Vimeo `dnt=1`) that mount only while open (FR-2/FR-5)                                                                                                                                                         |
| Composition  | `App.jsx` — `Page` reads `getProjects()`/`getProfile()` once and passes props (architecture §3 respected: no component touches the repository); owns modal state; `WorkSection` (grid + empty state) and `AboutSection` split out to respect the 150-line rule                                                                                                                                                                        |
| Token        | New `--container-modal: 55rem` in `theme.css` (design §4/§5 synced) — the spec'd 880px modal width as a token instead of a forbidden arbitrary value                                                                                                                                                                                                                                                                                  |
| Dictionaries | Grew to 23 keys per language (section titles, a11y labels, featured/links labels); removed unused `hero.kicker`; parity test keeps them in lockstep                                                                                                                                                                                                                                                                                   |
| Tests        | 17 new (55 total): hash-parsing matrix; the spec'd App smoke suite — 8 cards render, pill click filters to 2 + writes the hash, shared `#work/graphic` URL initializes filtered, modal opens with title/closes, iframes exist only while the modal is open, language toggle flips the whole page, services + contact CTA render                                                                                                       |

## 2. Verification results

| Check                  | Result                                                         |
| ---------------------- | -------------------------------------------------------------- |
| `npm run lint`         | ✅ clean                                                       |
| `npm run check:tokens` | ✅ clean — no raw visual values in any of the 9 new components |
| `npm run test`         | ✅ 55/55 (38 prior + 17 new)                                   |
| `npm run build`        | ✅ JS 67.1 kB gzip, CSS 4.7 kB gzip — budget <150 kB intact    |

## 3. Deviations from spec

1. **Filter pills update the URL via `history.replaceState`** instead of assigning `location.hash` (architecture §5 implied the latter): direct assignment scroll-jumps to the `#work` anchor on every "All" click. `replaceState` + a manual `hashchange` dispatch keeps the URL shareable without the jump. Pasted `#work/<cat>` URLs still work.
2. **Card titles are styled spans, not `<h3>`** — the whole card is a `<button>` (design §5), and headings aren't valid inside buttons. The modal title is a real `<h2>`.

## 4. Issues found & fixed

- **jsdom doesn't implement `dialog.showModal()`** (2 test failures): added a minimal polyfill in `src/test/setup.js` (toggles `open`, fires `close`). Production code stays clean — every target browser ships the real API.

## 5. Decisions of record

- **Native `<dialog>` over a hand-rolled focus trap** — less custom a11y code, platform-correct behavior, zero deps.
- Featured projects get a small accent dot + label rather than a different card size — keeps the grid calm (design principle 1) while satisfying "may be visually emphasized" (FR-1).
- `VideoEmbed` lives inside `ProjectDetail.jsx` (not the inventory) since embeds exist only there.

## 6. Next steps

Roadmap v1 step 6 (polish): scroll-reveal in `Section` (IntersectionObserver, reduced-motion aware), keyboard walkthrough, hover/empty-state pass. Then step 7 (SEO/meta, OG image, deploy prep). Awaiting user review of this step first.
