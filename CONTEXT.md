# Portfolio Authoring

This context covers the content-management experience used to turn a designer's completed work into the public portfolio. It distinguishes the portfolio owner and a project's editorial state from the public visitor experience.

## Language

**Portfolio Owner**:
João, the sole person authorized to create, revise, and publish portfolio content in the first version.
_Avoid_: Client, administrator, editor

**Portfolio Project**:
The complete bilingual presentation of one finished piece of work, including its media and portfolio metadata.
_Avoid_: Entry, record, post

**Project Slug**:
The system-generated immutable identifier derived from a new Portfolio Project's Portuguese title. It remains fixed when the title changes.
_Avoid_: Editable filename, regenerated URL

**Project Deep Link**:
The stable public URL based on a Published Project's Project Slug that opens its detail within the one-page Showcase Portfolio and participates in browser Back and Forward navigation.
_Avoid_: File URL, temporary preview link

**Published Project**:
A Portfolio Project on the `main` branch and visible to public visitors.
_Avoid_: Live project, public record

**Preview Branch**:
The protected `content-preview` Git branch containing a batch of proposed portfolio changes, with a separate Vercel deployment for review before merging.
_Avoid_: Project Draft, staging record, per-project branch

**Publication**:
The protected merge of `content-preview` into `main`, which makes its Portfolio Project changes public. Direct pushes to `main` are not permitted.
_Avoid_: Save, deploy

**Publication Pull Request**:
The GitHub pull request from `content-preview` to protected `main` that the dashboard opens or creates once proposed changes meet the Publication Gate.
_Avoid_: Dashboard merge, direct publish

**Cover Image**:
An image selected from a Portfolio Project's gallery and automatically transformed to fit its thumbnail presentation.
_Avoid_: Thumbnail upload, card image

**Primary Discipline**:
The required main classification of a Portfolio Project, used to place it in the public portfolio's principal filter.
_Avoid_: Category, tag

**Secondary Discipline**:
An optional additional classification that describes other disciplines represented by a Portfolio Project.
_Avoid_: Extra category, tag

**Discipline Catalog**:
The Portfolio Owner-managed, ordered set of disciplines in `content/disciplines.json`, available for a Portfolio Project's Primary and Secondary Discipline values and for public filtering. Each item has required PT-BR and EN labels, a Portfolio Owner-chosen display order, and a system-generated immutable ID. Public filters match a Portfolio Project's Primary Discipline only.
_Avoid_: Fixed category enum, hard-coded filters

**Archived Discipline**:
A Discipline Catalog item that cannot be selected for new work or shown as a public filter, but whose identity and history are retained after its project assignments are removed.
_Avoid_: Deleted category, inactive tag

**Preview Checklist**:
The per-project list of missing publication requirements shown while proposed changes are reviewed on a Preview Branch.
_Avoid_: Draft status, error list

**Publication Gate**:
The requirements a Preview Branch must satisfy before it can merge into `main`: complete PT-BR and EN content for every required localized field, valid media and links, successful image processing and production build, and the Portfolio Owner's timestamped Restricted Preview review attestation in the Publication Pull Request.
_Avoid_: Save validation, draft validation

**Restricted Preview**:
The Vercel deployment of the Preview Branch that only the Portfolio Owner and one deliberately invited External Reviewer may access at a time. It displays a restrained notice that it is not public.
_Avoid_: Unlisted preview, public staging site

**External Reviewer**:
A person invited to access a Restricted Preview without requiring GitHub or Vercel account access.
_Avoid_: Collaborator, repository user

**Archived Project**:
A Portfolio Project whose content and image masters are moved outside production build input while its history is retained for possible restoration. Restoring it returns the project to `content-preview` and requires the Publication Gate.
_Avoid_: Deleted project, hidden project

**Project Narrative**:
Optional bilingual written content that explains a Portfolio Project. When supplied, it has both PT-BR and EN values.
_Avoid_: Required description, project summary

**First Publication Date**:
The system-managed time at which a Portfolio Project was first merged into `main`. It is not public portfolio content.
_Avoid_: Project date, completion date

**Showcase Rank**:
The Portfolio Owner-controlled global ordering of Published Projects in the Showcase Portfolio, set by drag and drop in the Project Workspace. New projects start at the bottom; rank replaces a featured flag.
_Avoid_: Publication order, featured project

**Publication History**:
The private record of a Portfolio Project's first and later Publications, derived from protected GitHub merges. Restoring an Archived Project retains its First Publication Date; reverting a Publication is recorded as a later Publication.
_Avoid_: Public timeline, project date

**Preview Validation**:
The permissive validation mode used only on `content-preview`. It renders incomplete Portfolio Projects with Preview Checklist guidance; `main` uses the strict published schema.
_Avoid_: Persisted draft state, production validation

**Publication Revert**:
A GitHub pull request that restores a previous public portfolio state through the normal Preview Branch, Publication Gate, and protected merge workflow.
_Avoid_: Direct rollback, production hotfix

**Portfolio Profile**:
The public-facing display name and optional Brand Logo that the Portfolio Owner manages for the showcase.
_Avoid_: Account settings, user profile

**Showcase Portfolio**:
The public work presentation that intentionally excludes About and Contact sections, biography, services, email, social links, and a discipline descriptor. It retains a compact masthead with identity, optional logo, and language control before the work.
_Avoid_: Lead-generation site, personal website

**Brand Logo**:
A Portfolio Owner-provided optional logo shown in the Showcase Portfolio masthead. It remains swappable while its background treatment is being finalized.
_Avoid_: Portrait, avatar

**Project Workspace**:
The dashboard's searchable project list. Its Published, Changed in Preview, Needs Completion, and Archived badges are derived from the branch difference and Publication Gate, not stored as project states.
_Avoid_: Draft board, status workflow

**Project Editor**:
The PT-BR dashboard editor for a Portfolio Project. Its free-moving sections are Identity and Disciplines, Gallery and Cover, Context and Links, and Review; a persistent Preview Checklist identifies Publication Gate blockers.
_Avoid_: Step wizard, one long unstructured form

**Focal Point**:
An optional position chosen by the Portfolio Owner to preserve the important area of a Cover Image when the system creates its thumbnail crop.
_Avoid_: Manual thumbnail upload, crop asset

**Gallery**:
The Portfolio Owner-ordered mix of a Portfolio Project's images and validated hosted videos. It contains at least one Cover-Eligible Image.
_Avoid_: Media attachments, asset bucket

**Cover-Eligible Image**:
An image in a Gallery that may be selected as the Portfolio Project's Cover Image.
_Avoid_: Separate thumbnail upload, video poster

**Image Alt Text**:
The required PT-BR and EN description entered beside each Gallery image. It is evaluated by the Preview Checklist and never inferred from a filename.
_Avoid_: Filename fallback, automatic caption

**Paired Translation Entry**:
The side-by-side PT-BR and EN editor with completion indicators and an optional copy-PT-BR starting helper. It does not perform machine translation.
_Avoid_: Automatic translation, single-language input

**Showcase Language Choice**:
The PT-BR or EN visitor preference inferred from the browser on first visit and persisted for later visits.
_Avoid_: Authoring language, fixed Portuguese default

**Gallery Image Master**:
The retained high-resolution source image from which the system derives a Gallery image's public responsive WebP variants and any future Cover Image crop.
_Avoid_: Disposable upload, thumbnail source

**Image Processing Status**:
The dashboard's `uploaded`, `processing`, `ready`, or `failed` report for a Gallery Image Master as the Preview Branch build produces its public variants.
_Avoid_: Instant upload, silent build step

**Preview Save**:
The Portfolio Owner's explicit commit of proposed changes to `content-preview`, which starts a new Restricted Preview deployment. It is allowed before the Publication Gate passes.
_Avoid_: Browser autosave, direct publish

**Visible Discipline**:
An active Discipline Catalog item assigned as the Primary Discipline of at least one Published Project, and therefore displayed as a public filter.
_Avoid_: Empty filter, all active disciplines

**Tool Label**:
An optional free-text label for software or production tools used in a Portfolio Project. Existing labels may be suggested but are not centrally managed.
_Avoid_: Tool catalog, required skill

**Project Context**:
Optional information identifying the client or brand and João's bilingual role for a Portfolio Project. It is omitted for confidential or self-initiated work.
_Avoid_: Required credits, case study

**Video Provider**:
A system-supported, validated host for a Gallery video. The initial providers are YouTube, Vimeo, and Adobe CCV.
_Avoid_: Custom embed, arbitrary iframe

**External Link**:
An optional validated HTTPS URL associated with a Portfolio Project and presented with a Portfolio Owner-written bilingual label.
_Avoid_: Raw URL, unvalidated link
