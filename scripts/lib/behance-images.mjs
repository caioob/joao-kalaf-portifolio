import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'

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

export async function convertToWebP(buffer, destPath, type) {
  mkdirSync(dirname(destPath), { recursive: true })
  const pipeline = sharp(buffer).webp({ quality: 80 })

  if (type === 'thumbnail') {
    pipeline.resize(1600, 1000, { fit: 'cover', position: 'centre' })
  } else {
    pipeline.resize(1600, null, { fit: 'inside', withoutEnlargement: true })
  }

  await pipeline.toFile(destPath)
}

export async function processImages(mappedProjects, outputDir) {
  const imageUrls = parseImageUrls(mappedProjects, outputDir)
  let missing = 0

  for (const { url, dest, type } of imageUrls) {
    try {
      const buffer = await downloadImage(url, dest)
      await convertToWebP(buffer, dest, type)
      console.log(`  ✓ ${type}: ${dest}`)
    } catch (err) {
      missing++
      console.warn(`  ✗ ${type}: ${url} — ${err.message}`)
    }
  }

  return missing
}
