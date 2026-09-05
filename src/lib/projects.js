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
import rawDisciplineCatalog from '../../content/disciplines.json'

const projectModules = import.meta.glob('../../content/projects/*.json', { eager: true })
const rawProjects = Object.values(projectModules).map((mod) => mod.default ?? mod)

const rawDisciplines = rawDisciplineCatalog.disciplines ?? []

export const DISCIPLINE_IDS = rawDisciplines.map((discipline) => discipline.id)

const VIDEO_PROVIDERS = ['youtube', 'vimeo', 'adobe-ccv']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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
  if (image.focalPoint != null) {
    const { x, y } = image.focalPoint
    if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || x > 100 || y < 0 || y > 100) {
      errors.push(`${field}.focalPoint: x and y must be percentages from 0 to 100`)
    }
  }
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

function isRank(value) {
  return Number.isInteger(value) && value >= 0
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function disciplineErrors(discipline) {
  const errors = []
  if (!isNonEmptyString(discipline?.id)) errors.push('id: required string')
  if (!isLocalized(discipline?.label)) errors.push('label: requires non-empty pt and en')
  if (!isRank(discipline?.rank)) errors.push('rank: must be a non-negative integer')
  if (typeof discipline?.archived !== 'boolean') errors.push('archived: required boolean')
  return errors
}

function portfolioMediaErrors(item, field) {
  const errors = []
  if (!isNonEmptyString(item?.id)) errors.push(`${field}.id: required string`)
  if (item?.type === 'image') return [...errors, ...imageErrors(item, field)]
  if (item?.type === 'video') return [...errors, ...mediaErrors(item, field)]
  return [...errors, `${field}.type: must be "image" or "video"`]
}

function portfolioProjectErrors(project, disciplines) {
  const errors = []
  if (!isNonEmptyString(project?.id)) errors.push('id: required string')
  if (!isNonEmptyString(project?.slug)) errors.push('slug: required string')
  else if (!SLUG_RE.test(project.slug)) errors.push('slug: must be kebab-case')
  if (!isRank(project?.rank)) errors.push('rank: must be a non-negative integer')
  if (!disciplines.has(project?.primaryDisciplineId)) {
    errors.push('primaryDisciplineId: must reference a discipline')
  } else if (disciplines.get(project.primaryDisciplineId).archived) {
    errors.push('primaryDisciplineId: must not reference an archived discipline')
  }
  if (!Array.isArray(project?.secondaryDisciplineIds)) {
    errors.push('secondaryDisciplineIds: must be an array')
  } else {
    for (const id of project.secondaryDisciplineIds) {
      if (!disciplines.has(id)) errors.push(`secondaryDisciplineIds: unknown discipline "${id}"`)
      else if (disciplines.get(id).archived)
        errors.push(`secondaryDisciplineIds: archived discipline "${id}"`)
      if (id === project.primaryDisciplineId)
        errors.push('secondaryDisciplineIds: must not include primaryDisciplineId')
    }
  }
  if (!isLocalized(project?.title)) errors.push('title: requires non-empty pt and en')
  if (
    project?.description != null &&
    (!isLocalized(project.description) ||
      typeof project.description.pt !== 'string' ||
      typeof project.description.en !== 'string')
  ) {
    errors.push('description: requires non-empty pt and en when supplied')
  }
  if (!Array.isArray(project?.media) || project.media.length === 0) {
    errors.push('media: requires at least one item')
  } else {
    const seenMediaIds = new Set()
    for (const [index, item] of project.media.entries()) {
      errors.push(...portfolioMediaErrors(item, `media[${index}]`))
      if (seenMediaIds.has(item?.id)) errors.push(`media[${index}].id: duplicate`)
      seenMediaIds.add(item?.id)
    }
    const cover = project.media.find((item) => item?.id === project.coverMediaId)
    if (cover?.type !== 'image') errors.push('coverMediaId: must reference an image in media')
  }
  if (
    project?.tools != null &&
    (!Array.isArray(project.tools) || !project.tools.every(isNonEmptyString))
  ) {
    errors.push('tools: must be non-empty strings')
  }
  if (project?.context != null) {
    if (!isNonEmptyString(project.context.clientOrBrand))
      errors.push('context.clientOrBrand: required string when context is supplied')
    if (!isLocalized(project.context.role))
      errors.push('context.role: requires non-empty pt and en')
  }
  if (project?.links != null) {
    if (!Array.isArray(project.links)) {
      errors.push('links: must be an array')
    } else {
      for (const [index, link] of project.links.entries()) {
        if (!isLocalized(link?.label))
          errors.push(`links[${index}].label: requires non-empty pt and en`)
        if (!isHttpsUrl(link?.url)) errors.push(`links[${index}].url: requires HTTPS URL`)
      }
    }
  }
  return errors
}

export function loadPortfolio({ projects, disciplines }, { strict, preview = false }) {
  const validDisciplines = []
  const disciplineIds = new Set()

  for (const discipline of disciplines ?? []) {
    const errors = disciplineErrors(discipline)
    if (disciplineIds.has(discipline?.id)) errors.push('id: duplicate')
    if (errors.length > 0) {
      const message = `Invalid discipline "${discipline?.id ?? '<missing id>'}" — ${errors.join('; ')}`
      if (strict) throw new Error(message)
      console.warn(`[disciplines] skipping: ${message}`)
      continue
    }
    disciplineIds.add(discipline.id)
    validDisciplines.push(discipline)
  }

  const disciplinesById = new Map(validDisciplines.map((discipline) => [discipline.id, discipline]))
  const validProjects = []
  const previewChecklist = []
  const seenProjectIds = new Set()
  const seenSlugs = new Set()

  for (const project of projects ?? []) {
    const errors = portfolioProjectErrors(project, disciplinesById)
    if (seenProjectIds.has(project?.id)) errors.push('id: duplicate')
    if (seenSlugs.has(project?.slug)) errors.push('slug: duplicate')
    if (validProjects.some((item) => item.rank === project?.rank)) errors.push('rank: duplicate')
    if (errors.length > 0) {
      const message = `Invalid portfolio project "${project?.id ?? '<missing id>'}" — ${errors.join('; ')}`
      if (strict) throw new Error(message)
      if (preview) {
        validProjects.push({ ...project, previewBlockers: errors })
        previewChecklist.push({ projectId: project?.id ?? '<missing id>', blockers: errors })
        seenProjectIds.add(project?.id)
        seenSlugs.add(project?.slug)
        continue
      }
      console.warn(`[portfolio] skipping: ${message}`)
      continue
    }
    seenProjectIds.add(project.id)
    seenSlugs.add(project.slug)
    validProjects.push(project)
  }

  const rankedProjects = validProjects.sort((a, b) => a.rank - b.rank)
  const visibleIds = new Set(
    rankedProjects
      .filter((project) => isRenderableProject(project, validDisciplines))
      .map((project) => project.primaryDisciplineId),
  )
  const visibleDisciplines = validDisciplines
    .filter((discipline) => !discipline.archived && visibleIds.has(discipline.id))
    .sort((a, b) => a.rank - b.rank)

  return {
    projects: rankedProjects,
    disciplines: validDisciplines,
    visibleDisciplines,
    previewChecklist,
  }
}

export function isRenderableProject(project, disciplines = null) {
  return (
    isNonEmptyString(project?.id) &&
    isNonEmptyString(project?.slug) &&
    isLocalized(project?.title) &&
    isNonEmptyString(project?.primaryDisciplineId) &&
    (disciplines == null ||
      disciplines.some(
        (discipline) => !discipline.archived && discipline.id === project.primaryDisciplineId,
      )) &&
    project?.media?.some((media) => media.id === project.coverMediaId && media.type === 'image')
  )
}

function portfolioProfileErrors(profile) {
  const errors = []
  if (!isNonEmptyString(profile?.name)) errors.push('name: required string')
  if (profile?.logo != null && !isNonEmptyString(profile.logo))
    errors.push('logo: must be a string or null')
  return errors
}

export function loadPortfolioProfile(raw, { strict }) {
  const errors = portfolioProfileErrors(raw)
  if (errors.length > 0) {
    const message = `Invalid portfolio profile — ${errors.join('; ')}`
    if (strict) throw new Error(message)
    console.warn(`[profile] ${message}`)
  }
  return raw
}

let portfolioCache = null

export function getPortfolio() {
  const preview = import.meta.env.VITE_PORTFOLIO_MODE === 'preview'
  portfolioCache ??= loadPortfolio(
    { projects: rawProjects, disciplines: rawDisciplines },
    { strict: !preview, preview },
  )
  return portfolioCache
}

export function getProjects() {
  return getPortfolio().projects
}

export function getProjectsByDiscipline(disciplineId) {
  if (!DISCIPLINE_IDS.includes(disciplineId)) {
    if (import.meta.env.VITE_PORTFOLIO_MODE !== 'preview')
      throw new Error(`Unknown discipline "${disciplineId}"`)
    return []
  }
  return getProjects().filter((project) => project.primaryDisciplineId === disciplineId)
}

export function getVisibleDisciplines() {
  return getPortfolio().visibleDisciplines
}

export function getCoverMedia(project) {
  return project.media.find((media) => media.id === project.coverMediaId)
}

/** @returns {import('./types').Profile} */
export function getProfile() {
  return loadPortfolioProfile(rawProfile, {
    strict: import.meta.env.VITE_PORTFOLIO_MODE !== 'preview',
  })
}
