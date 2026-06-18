/**
 * Build-time responsive image generator (docs/08).
 *
 * For every image master referenced by content/, ensures a canonical WebP master
 * exists (converting + capping a CMS upload of any format — jpg/png/… — if
 * needed), records its intrinsic width/height back into the JSON, and writes the
 * sub-intrinsic WebP ladder rungs next to it. Idempotent: already-normalized
 * masters with their variants are a no-op, so committed output makes builds fast
 * and a Decap upload only generates its own files.
 *
 * Runs as the `build` prebuild step (so a client upload is optimized on deploy)
 * and standalone via `npm run images` (run it locally after editing, then commit
 * the normalized JSON + generated WebP).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { canonicalSrc, variantSrc, variantWidths } from '../src/lib/images.js'

const PUBLIC = 'public'
const PROJECTS_DIR = 'content/projects'
const PROFILE = 'content/profile.json'
const WEBP = { quality: 80 }

// How a canonical master is sized when (re)generated from a raw upload.
function capMaster(pipeline, slot) {
  if (slot === 'thumbnail') return pipeline.resize(1600, 1000, { fit: 'cover', position: 'centre' })
  const max = slot === 'portrait' ? 960 : 2560
  return pipeline.resize(max, null, { fit: 'inside', withoutEnlargement: true })
}

const counts = { generated: 0, skipped: 0, normalized: 0, missing: 0 }

/**
 * Ensure a canonical WebP master + ladder for one image object ({ src, width,
 * height }), mutating it in place. Returns true if the object changed.
 */
async function processImage(image, slot) {
  const canonical = canonicalSrc(image.src)
  const canonicalPath = PUBLIC + canonical
  let changed = false

  if (!existsSync(canonicalPath)) {
    const sourcePath = PUBLIC + image.src
    if (!existsSync(sourcePath)) {
      counts.missing++
      console.warn(`  ✗ missing master: ${sourcePath}`)
      return false
    }
    const info = await capMaster(sharp(sourcePath), slot).webp(WEBP).toFile(canonicalPath)
    counts.normalized++
    console.log(`  ↻ ${image.src} → ${canonical} (${info.width}×${info.height})`)
  }

  const { width, height } = await sharp(canonicalPath).metadata()
  if (image.src !== canonical) ((image.src = canonical), (changed = true))
  if (image.width !== width) ((image.width = width), (changed = true))
  if (image.height !== height) ((image.height = height), (changed = true))

  for (const w of variantWidths(slot, width)) {
    const outPath = PUBLIC + variantSrc(canonical, w)
    if (existsSync(outPath)) {
      counts.skipped++
      continue
    }
    await sharp(canonicalPath).resize(w, null, { withoutEnlargement: true }).webp(WEBP).toFile(outPath)
    counts.generated++
  }
  return changed
}

for (const file of readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'))) {
  const path = `${PROJECTS_DIR}/${file}`
  const project = JSON.parse(readFileSync(path, 'utf8'))
  let changed = false
  if (project.thumbnail?.src) changed = (await processImage(project.thumbnail, 'thumbnail')) || changed
  for (const item of project.media ?? []) {
    if (item.type === 'image') changed = (await processImage(item, 'gallery')) || changed
  }
  if (changed) writeFileSync(path, JSON.stringify(project, null, 2) + '\n')
}

const profile = JSON.parse(readFileSync(PROFILE, 'utf8'))
if (profile.photo?.src && (await processImage(profile.photo, 'portrait'))) {
  writeFileSync(PROFILE, JSON.stringify(profile, null, 2) + '\n')
}

console.log(
  `images: ${counts.generated} generated, ${counts.skipped} skipped, ${counts.normalized} normalized` +
    (counts.missing ? `, ${counts.missing} missing` : ''),
)
if (counts.missing > 0) process.exitCode = 1
