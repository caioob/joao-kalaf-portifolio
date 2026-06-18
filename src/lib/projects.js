/**
 * Content repository — the only module that reads the data JSON
 * (architecture §3). Components receive data via props from App; v2 swaps
 * these internals for a backend without touching the UI.
 *
 * Failure mode (content-model §1): strict (dev) throws naming the record and
 * field; non-strict (prod) skips the record with a console.warn so one bad
 * edit never blanks the whole site.
 */
// Content lives as one JSON file per project under /content (v2 layout,
// docs/02 §2 / docs/07). Vite globs them at build time; the seam below
// (getProjects/getProfile) and the validators are unchanged — only the source
// of the raw records moved out of src/data.
import rawProfile from '../../content/profile.json'

const projectModules = import.meta.glob('../../content/projects/*.json', { eager: true })
const rawProjects = Object.values(projectModules).map((mod) => mod.default ?? mod)

/** Canonical category enum — filters, services, and the v2 admin form all key off it. */
export const CATEGORIES = ['video', 'motion', 'product', 'graphic']

const VIDEO_PROVIDERS = ['youtube', 'vimeo', 'adobe-ccv']
const DATE_RE = /^\d{4}-\d{2}$/

const STRICT = import.meta.env.DEV

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function isLocalized(value) {
  return value != null && isNonEmptyString(value.pt) && isNonEmptyString(value.en)
}

function imageErrors(image, field) {
  if (image == null) return [`${field}: required`]
  const errors = []
  if (!isNonEmptyString(image.src)) errors.push(`${field}.src: required string`)
  if (!isLocalized(image.alt)) errors.push(`${field}.alt: requires non-empty pt and en`)
  return errors
}

function mediaErrors(item, field) {
  if (item?.type === 'image') return imageErrors(item, field)
  if (item?.type === 'video') {
    const errors = []
    if (!VIDEO_PROVIDERS.includes(item.provider))
      errors.push(`${field}.provider: must be one of ${VIDEO_PROVIDERS.join(', ')}`)
    if (!isNonEmptyString(item.videoId)) errors.push(`${field}.videoId: required string`)
    if (!isLocalized(item.title)) errors.push(`${field}.title: requires non-empty pt and en`)
    return errors
  }
  return [`${field}.type: must be "image" or "video"`]
}

function projectErrors(project) {
  const errors = []
  if (!isNonEmptyString(project.id)) errors.push('id: required string')
  if (!isNonEmptyString(project.slug)) errors.push('slug: required string')
  if (!CATEGORIES.includes(project.category))
    errors.push(`category: must be one of ${CATEGORIES.join(', ')}`)
  if (!isLocalized(project.title)) errors.push('title: requires non-empty pt and en')
  // Description is optional copy — any pt/en combination is allowed (both empty,
  // one filled, or both). pick() falls back gracefully, so a partial translation
  // from the CMS renders fine rather than breaking the build.
  if (
    project.description != null &&
    (typeof project.description.pt !== 'string' || typeof project.description.en !== 'string')
  )
    errors.push('description: pt and en must be strings')
  if (!DATE_RE.test(project.date ?? '')) errors.push('date: must match YYYY-MM')
  errors.push(...imageErrors(project.thumbnail, 'thumbnail'))
  if (!Array.isArray(project.media) || project.media.length === 0) {
    errors.push('media: requires at least one item')
  } else {
    project.media.forEach((item, i) => errors.push(...mediaErrors(item, `media[${i}]`)))
  }
  if (project.tools != null && !project.tools.every(isNonEmptyString))
    errors.push('tools: must be non-empty strings')
  if (project.links != null) {
    project.links.forEach((link, i) => {
      if (!isLocalized(link?.label)) errors.push(`links[${i}].label: requires non-empty pt and en`)
      if (!isNonEmptyString(link?.url)) errors.push(`links[${i}].url: required string`)
    })
  }
  return errors
}

/**
 * Pure loader, exported for tests. Validates and sorts newest-first.
 * @param {unknown[]} raw
 * @param {{ strict: boolean }} options
 * @returns {import('./types').Project[]}
 */
export function loadProjects(raw, { strict }) {
  const seenIds = new Set()
  const seenSlugs = new Set()
  const valid = []

  for (const project of raw) {
    const errors = projectErrors(project)
    if (seenIds.has(project.id)) errors.push('id: duplicate')
    if (seenSlugs.has(project.slug)) errors.push('slug: duplicate')

    if (errors.length > 0) {
      const message = `Invalid project "${project?.id ?? '<missing id>'}" — ${errors.join('; ')}`
      if (strict) throw new Error(message)
      console.warn(`[projects] skipping: ${message}`)
      continue
    }

    seenIds.add(project.id)
    seenSlugs.add(project.slug)
    valid.push(project)
  }

  return valid.sort((a, b) => b.date.localeCompare(a.date))
}

function profileErrors(profile) {
  const errors = []
  if (!isNonEmptyString(profile.name)) errors.push('name: required string')
  if (!isLocalized(profile.tagline)) errors.push('tagline: requires non-empty pt and en')
  if (!isLocalized(profile.bio)) errors.push('bio: requires non-empty pt and en')
  if (profile.email != null && profile.email !== '' && !profile.email.includes('@'))
    errors.push('email: must be a valid email address if provided')

  const serviceIds = (profile.services ?? []).map((s) => s?.id)
  if (serviceIds.length !== CATEGORIES.length || !CATEGORIES.every((c) => serviceIds.includes(c))) {
    errors.push(`services: exactly one per category (${CATEGORIES.join(', ')})`)
  }
  for (const service of profile.services ?? []) {
    if (!isLocalized(service?.name) || !isLocalized(service?.blurb))
      errors.push(`services[${service?.id}]: name and blurb require non-empty pt and en`)
  }

  if (profile.socials != null) {
    profile.socials.forEach((social, i) => {
      if (!isNonEmptyString(social?.label) || !isNonEmptyString(social?.url))
        errors.push(`socials[${i}]: requires label and url`)
    })
  }
  if (profile.photo != null) errors.push(...imageErrors(profile.photo, 'photo'))
  return errors
}

/**
 * Pure loader, exported for tests. Unlike projects, an invalid profile cannot
 * be "skipped" — non-strict mode warns and returns it as-is.
 * @param {unknown} raw
 * @param {{ strict: boolean }} options
 * @returns {import('./types').Profile}
 */
export function loadProfile(raw, { strict }) {
  const errors = profileErrors(raw)
  if (errors.length > 0) {
    const message = `Invalid profile — ${errors.join('; ')}`
    if (strict) throw new Error(message)
    console.warn(`[profile] ${message}`)
  }
  return raw
}

let projectsCache = null
let profileCache = null

/** @returns {import('./types').Project[]} validated, newest-first */
export function getProjects() {
  projectsCache ??= loadProjects(rawProjects, { strict: STRICT })
  return projectsCache
}

/** @returns {import('./types').Project[]} */
export function getProjectsByCategory(category) {
  if (!CATEGORIES.includes(category)) {
    if (STRICT) throw new Error(`Unknown category "${category}"`)
    return []
  }
  return getProjects().filter((project) => project.category === category)
}

/** @returns {import('./types').Profile} */
export function getProfile() {
  profileCache ??= loadProfile(rawProfile, { strict: STRICT })
  return profileCache
}
