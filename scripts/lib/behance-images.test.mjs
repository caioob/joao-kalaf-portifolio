// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { thumbnailDest, galleryImageDest, parseImageUrls } from './behance-images.mjs'

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
