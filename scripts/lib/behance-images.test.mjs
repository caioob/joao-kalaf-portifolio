// @vitest-environment node
import { describe, it, expect, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import {
  thumbnailDest,
  galleryImageDest,
  parseImageUrls,
  convertToWebP,
  applyImageDimensions,
  GALLERY_MAX_WIDTH,
  THUMB_WIDTH,
  THUMB_HEIGHT,
} from './behance-images.mjs'

const solid = (w, h) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 10, g: 20, b: 30 } } })
    .png()
    .toBuffer()

describe('thumbnailDest', () => {
  it('returns correct path for a slug', () => {
    expect(thumbnailDest('my-project', '/out')).toBe('/out/images/my-project-thumb.webp')
  })
})

describe('galleryImageDest', () => {
  it('returns correct path with 1-indexed number', () => {
    expect(galleryImageDest('my-project', 1, '/out')).toBe('/out/images/my-project-1.webp')
    expect(galleryImageDest('my-project', 3, '/out')).toBe('/out/images/my-project-3.webp')
  })
})

describe('parseImageUrls', () => {
  it('collects cover URL and media URLs from mapped projects', () => {
    const mapped = [
      {
        project: { id: 'p-001', slug: 'proj-a' },
        meta: {
          coverUrl: 'https://cdn.behance.net/cover.jpg',
          mediaUrls: ['https://cdn.behance.net/img1.jpg', 'https://cdn.behance.net/img2.jpg'],
          warnings: [],
          skippedModules: [],
        },
      },
    ]
    const urls = parseImageUrls(mapped, '/out')
    expect(urls).toHaveLength(3)
    expect(urls[0]).toEqual({
      url: 'https://cdn.behance.net/cover.jpg',
      dest: '/out/images/proj-a-thumb.webp',
      type: 'thumbnail',
    })
    expect(urls[1]).toEqual({
      url: 'https://cdn.behance.net/img1.jpg',
      dest: '/out/images/proj-a-1.webp',
      type: 'gallery',
    })
    expect(urls[2]).toEqual({
      url: 'https://cdn.behance.net/img2.jpg',
      dest: '/out/images/proj-a-2.webp',
      type: 'gallery',
    })
  })

  it('skips empty cover URLs', () => {
    const mapped = [
      {
        project: { id: 'p-001', slug: 'proj-a' },
        meta: { coverUrl: '', mediaUrls: [], warnings: [], skippedModules: [] },
      },
    ]
    const urls = parseImageUrls(mapped, '/out')
    expect(urls).toHaveLength(0)
  })

  it('handles empty array', () => {
    expect(parseImageUrls([], '/out')).toEqual([])
  })
})

describe('convertToWebP', () => {
  const dir = mkdtempSync(join(tmpdir(), 'behance-img-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('crops thumbnails to the 16:10 master and returns its dimensions', async () => {
    const dims = await convertToWebP(await solid(4000, 4000), join(dir, 'a-thumb.webp'), 'thumbnail')
    expect(dims).toEqual({ width: THUMB_WIDTH, height: THUMB_HEIGHT })
  })

  it('caps gallery masters at GALLERY_MAX_WIDTH, preserving aspect', async () => {
    const dims = await convertToWebP(await solid(4000, 2500), join(dir, 'a-1.webp'), 'gallery')
    expect(dims.width).toBe(GALLERY_MAX_WIDTH)
    expect(dims.height).toBe(Math.round((GALLERY_MAX_WIDTH * 2500) / 4000))
  })

  it('never upscales a gallery master past its source', async () => {
    const dims = await convertToWebP(await solid(800, 600), join(dir, 'a-2.webp'), 'gallery')
    expect(dims).toEqual({ width: 800, height: 600 })
  })
})

describe('applyImageDimensions', () => {
  it('writes dimensions onto the thumbnail and image media, matched by filename', () => {
    const mapped = [
      {
        project: {
          thumbnail: { src: '/images/projects/proj-a-thumb.webp', alt: {} },
          media: [
            { type: 'image', src: '/images/projects/proj-a-1.webp', alt: {} },
            { type: 'video', provider: 'youtube', videoId: 'x', title: {} },
          ],
        },
      },
    ]
    applyImageDimensions(mapped, {
      'proj-a-thumb.webp': { width: 1600, height: 1000 },
      'proj-a-1.webp': { width: 2560, height: 1440 },
    })
    expect(mapped[0].project.thumbnail).toMatchObject({ width: 1600, height: 1000 })
    expect(mapped[0].project.media[0]).toMatchObject({ width: 2560, height: 1440 })
    expect(mapped[0].project.media[1]).not.toHaveProperty('width')
  })

  it('leaves records without a matching dimension entry untouched', () => {
    const mapped = [
      { project: { thumbnail: { src: '/images/projects/missing-thumb.webp', alt: {} }, media: [] } },
    ]
    applyImageDimensions(mapped, {})
    expect(mapped[0].project.thumbnail).not.toHaveProperty('width')
  })
})
