import { mkdirSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import sharp from 'sharp'

// Canonical master dimensions (docs/08 §2). The smaller widths + AVIF variants
// are derived from these masters at build time, not here.
export const THUMB_WIDTH = 1600
export const THUMB_HEIGHT = 1000
export const GALLERY_MAX_WIDTH = 2560
export const WEBP_QUALITY = 80

export function thumbnailDest(slug, outputDir) {
  return `${outputDir}/images/${slug}-thumb.webp`
}

export function galleryImageDest(slug, index, outputDir) {
  return `${outputDir}/images/${slug}-${index}.webp`
}

export function parseImageUrls(mappedProjects, outputDir = './out') {
  const urls = []

  for (const { project, meta } of mappedProjects) {
    if (meta.coverUrl) {
      urls.push({
        url: meta.coverUrl,
        dest: thumbnailDest(project.slug, outputDir),
        type: 'thumbnail',
      })
    }
    meta.mediaUrls.forEach((url, i) => {
      urls.push({
        url,
        dest: galleryImageDest(project.slug, i + 1, outputDir),
        type: 'gallery',
      })
    })
  }

  return urls
}

export async function downloadImage(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  mkdirSync(dirname(destPath), { recursive: true })
  return buffer
}

/**
 * Write the canonical WebP master and return its intrinsic dimensions.
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function convertToWebP(buffer, destPath, type) {
  mkdirSync(dirname(destPath), { recursive: true })
  const pipeline = sharp(buffer).webp({ quality: WEBP_QUALITY })

  if (type === 'thumbnail') {
    pipeline.resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover', position: 'centre' })
  } else {
    pipeline.resize(GALLERY_MAX_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
  }

  const info = await pipeline.toFile(destPath)
  return { width: info.width, height: info.height }
}

/**
 * Download + convert every image, returning the failure count and a map of
 * filename → intrinsic dimensions (keyed by basename so it matches each record's
 * `src`). See applyImageDimensions.
 * @returns {Promise<{ missing: number, dimensions: Record<string, { width: number, height: number }> }>}
 */
export async function processImages(mappedProjects, outputDir) {
  const imageUrls = parseImageUrls(mappedProjects, outputDir)
  let missing = 0
  const dimensions = {}

  for (const { url, dest, type } of imageUrls) {
    try {
      const buffer = await downloadImage(url, dest)
      const { width, height } = await convertToWebP(buffer, dest, type)
      dimensions[basename(dest)] = { width, height }
      console.log(`  ✓ ${type}: ${dest} (${width}×${height})`)
    } catch (err) {
      missing++
      console.warn(`  ✗ ${type}: ${url} — ${err.message}`)
    }
  }

  return { missing, dimensions }
}

/**
 * Write recorded intrinsic dimensions onto each Image record (thumbnail + image
 * media), matched by filename. Mutates and returns the mappedProjects. Records
 * whose image failed to download are left without dimensions (optional in schema).
 */
export function applyImageDimensions(mappedProjects, dimensions) {
  for (const { project } of mappedProjects) {
    const thumb = dimensions[basename(project.thumbnail.src)]
    if (thumb) Object.assign(project.thumbnail, thumb)

    for (const item of project.media) {
      if (item.type !== 'image') continue
      const dims = dimensions[basename(item.src)]
      if (dims) Object.assign(item, dims)
    }
  }
  return mappedProjects
}
