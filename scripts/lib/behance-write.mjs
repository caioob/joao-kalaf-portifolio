import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export function buildReview({
  profileUrl,
  projectCount,
  warnings,
  skippedModules,
  untranslatedCount,
  missingImageCount,
}) {
  return {
    profileUrl,
    scrapedAt: new Date().toISOString(),
    projectCount,
    warnings,
    skippedModules,
    untranslatedFields: untranslatedCount,
    missingImages: missingImageCount,
  }
}

export function stripMeta(mappedProjects) {
  return mappedProjects.map((m) => m.project)
}

/** Per-file content layout (docs/02 §2): one file per project, named by slug. */
export function projectFilename(slug) {
  return `${slug}.json`
}

export function countTranslateMarkers(profile, projects) {
  let count = 0

  function countInObj(obj) {
    if (!obj || typeof obj !== 'object') return
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.startsWith('TRANSLATE:')) count++
      else if (typeof val === 'object') countInObj(val)
    }
  }

  countInObj(profile)
  for (const project of projects) countInObj(project)

  return count
}

export function writeOutput(data, outputDir) {
  mkdirSync(outputDir, { recursive: true })
  mkdirSync(join(outputDir, '_raw'), { recursive: true })
  mkdirSync(join(outputDir, 'images'), { recursive: true })
  mkdirSync(join(outputDir, 'projects'), { recursive: true })

  const projects = stripMeta(data.mappedProjects)
  const review = buildReview({
    profileUrl: data.profileUrl,
    projectCount: projects.length,
    warnings: data.mappedProjects.flatMap((m) => m.meta.warnings),
    skippedModules: data.mappedProjects.flatMap((m) => {
      const id = m.project.id
      const slug = m.project.slug
      return m.meta.skippedModules.map((s) => ({ projectId: id, slug, ...s }))
    }),
    untranslatedCount: countTranslateMarkers(data.profile, projects),
    missingImageCount: data.missingImageCount || 0,
  })

  writeFileSync(join(outputDir, 'profile.json'), JSON.stringify(data.profile, null, 2) + '\n')
  // One file per project (content/projects/<slug>.json layout), ready to copy
  // straight into the repo's content/ dir.
  for (const project of projects) {
    writeFileSync(
      join(outputDir, 'projects', projectFilename(project.slug)),
      JSON.stringify(project, null, 2) + '\n',
    )
  }
  writeFileSync(join(outputDir, '_review.json'), JSON.stringify(review, null, 2) + '\n')

  if (data.rawUser) {
    writeFileSync(
      join(outputDir, '_raw', 'profile-raw.json'),
      JSON.stringify(data.rawUser, null, 2) + '\n',
    )
  }
  if (data.rawProjects) {
    writeFileSync(
      join(outputDir, '_raw', 'projects-raw.json'),
      JSON.stringify(data.rawProjects, null, 2) + '\n',
    )
  }
}
