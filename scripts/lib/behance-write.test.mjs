// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildReview, stripMeta, countTranslateMarkers, projectFilename } from './behance-write.mjs'

describe('projectFilename', () => {
  it('names a project file by its slug', () => {
    expect(projectFilename('earphone-tws-product-video')).toBe('earphone-tws-product-video.json')
  })
})

describe('buildReview', () => {
  it('builds correct structure with all fields', () => {
    const review = buildReview({
      profileUrl: 'https://www.behance.net/joaokalaf/',
      projectCount: 5,
      warnings: [
        {
          projectId: 'p-003',
          slug: 'my-arch-project',
          field: 'category',
          message: "No matching creative field; defaulted to 'graphic'",
          behanceFields: ['Architecture', '3D Art'],
        },
      ],
      skippedModules: [
        { projectId: 'p-002', slug: 'video-project', moduleIndex: 3, type: 'embed', reason: 'Unsupported provider: Dailymotion' },
      ],
      untranslatedCount: 12,
      missingImageCount: 0,
    })

    expect(review.profileUrl).toBe('https://www.behance.net/joaokalaf/')
    expect(review.projectCount).toBe(5)
    expect(review.warnings).toHaveLength(1)
    expect(review.skippedModules).toHaveLength(1)
    expect(review.untranslatedFields).toBe(12)
    expect(review.missingImages).toBe(0)
    expect(review.scrapedAt).toBeTruthy()
  })

  it('builds correct structure with empty warnings', () => {
    const review = buildReview({
      profileUrl: 'https://www.behance.net/test/',
      projectCount: 2,
      warnings: [],
      skippedModules: [],
      untranslatedCount: 0,
      missingImageCount: 0,
    })

    expect(review.warnings).toEqual([])
    expect(review.skippedModules).toEqual([])
    expect(review.untranslatedFields).toBe(0)
  })

  it('includes ISO timestamp in scrapedAt', () => {
    const review = buildReview({
      profileUrl: '',
      projectCount: 0,
      warnings: [],
      skippedModules: [],
      untranslatedCount: 0,
      missingImageCount: 0,
    })
    expect(new Date(review.scrapedAt).toISOString()).toBe(review.scrapedAt)
  })
})

describe('stripMeta', () => {
  it('removes meta from mapped projects, keeping only portfolio-format objects', () => {
    const mapped = [
      {
        project: { id: 'p-001', slug: 'test', category: 'graphic' },
        meta: { coverUrl: 'https://...', mediaUrls: [], warnings: [], skippedModules: [] },
      },
    ]
    const result = stripMeta(mapped)
    expect(result).toEqual([{ id: 'p-001', slug: 'test', category: 'graphic' }])
  })

  it('handles empty array', () => {
    expect(stripMeta([])).toEqual([])
  })
})

describe('countTranslateMarkers', () => {
  it('counts TRANSLATE: markers across a profile and project array', () => {
    const profile = {
      name: 'Test',
      tagline: { pt: 'Oi', en: 'TRANSLATE:Oi' },
      bio: { pt: 'Bio', en: 'TRANSLATE:Bio' },
    }
    const projects = [
      {
        title: { pt: 'Proj', en: 'TRANSLATE:Proj' },
        description: { pt: 'Desc', en: 'TRANSLATE:Desc' },
        thumbnail: { src: '/img.webp', alt: { pt: 'Alt', en: 'TRANSLATE:Alt' } },
      },
    ]
    expect(countTranslateMarkers(profile, projects)).toBe(5)
  })

  it('returns 0 when no markers present', () => {
    const profile = { name: 'Test', tagline: { pt: '', en: '' }, bio: { pt: '', en: '' } }
    const projects = []
    expect(countTranslateMarkers(profile, projects)).toBe(0)
  })
})
