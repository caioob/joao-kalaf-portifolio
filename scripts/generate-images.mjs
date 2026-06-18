/**
 * Build-time responsive image generator (docs/08).
 *
 * Reads the canonical WebP masters referenced by content/ and writes the
 * sub-intrinsic WebP ladder rungs next to them in public/images/projects/.
 * Idempotent — existing variants are skipped, so committed variants make this a
 * near-instant no-op and a Decap-added master only generates its own few files.
 * Widths come from src/lib/images.js (shared with the frontend `srcset`), so the
 * files written here are exactly the ones a card references.
 *
 * Run: npm run images   (also runs as the prebuild step of `npm run build`)
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
import { variantWidths, variantSrc } from '../src/lib/images.js'

const PUBLIC = 'public'
const PROJECTS_DIR = 'content/projects'

function collectMasters() {
  const masters = []
  for (const file of readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'))) {
    const project = JSON.parse(readFileSync(`${PROJECTS_DIR}/${file}`, 'utf8'))
    masters.push({ src: project.thumbnail.src, slot: 'thumbnail' })
    for (const item of project.media) {
      if (item.type === 'image') masters.push({ src: item.src, slot: 'gallery' })
    }
  }
  const profile = JSON.parse(readFileSync('content/profile.json', 'utf8'))
  if (profile.photo?.src) masters.push({ src: profile.photo.src, slot: 'portrait' })
  return masters
}

let generated = 0
let skipped = 0
let missing = 0

for (const { src, slot } of collectMasters()) {
  const masterPath = PUBLIC + src
  if (!existsSync(masterPath)) {
    missing++
    console.warn(`  ✗ missing master: ${masterPath}`)
    continue
  }
  const { width } = await sharp(masterPath).metadata()
  for (const w of variantWidths(slot, width)) {
    const outPath = PUBLIC + variantSrc(src, w)
    if (existsSync(outPath)) {
      skipped++
      continue
    }
    await sharp(masterPath)
      .resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath)
    generated++
  }
}

console.log(`images: ${generated} generated, ${skipped} skipped${missing ? `, ${missing} missing masters` : ''}`)
if (missing > 0) process.exitCode = 1
