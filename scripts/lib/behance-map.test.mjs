// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  mapCategory,
  translateField,
  formatDate,
  extractSlug,
  sanitizeSlug,
  generateId,
  extractVideoInfo,
  mapMediaModules,
  mapProject,
  mapProfile,
  CATEGORY_MAP,
} from './behance-map.mjs'

describe('mapCategory', () => {
  it('maps video-related fields to "video"', () => {
    expect(mapCategory(['Video Editing']).category).toBe('video')
    expect(mapCategory(['Film']).category).toBe('video')
    expect(mapCategory(['Video Production']).category).toBe('video')
    expect(mapCategory(['Documentary']).category).toBe('video')
  })

  it('maps motion-related fields to "motion"', () => {
    expect(mapCategory(['Motion Design']).category).toBe('motion')
    expect(mapCategory(['Animation']).category).toBe('motion')
    expect(mapCategory(['After Effects']).category).toBe('motion')
    expect(mapCategory(['Motion Graphics']).category).toBe('motion')
    expect(mapCategory(['3D Animation']).category).toBe('motion')
  })

  it('maps product-related fields to "product"', () => {
    expect(mapCategory(['UI/UX']).category).toBe('product')
    expect(mapCategory(['Product Design']).category).toBe('product')
    expect(mapCategory(['Interaction Design']).category).toBe('product')
    expect(mapCategory(['UX Design']).category).toBe('product')
    expect(mapCategory(['UI Design']).category).toBe('product')
    expect(mapCategory(['App Design']).category).toBe('product')
  })

  it('maps graphic-related fields to "graphic"', () => {
    expect(mapCategory(['Graphic Design']).category).toBe('graphic')
    expect(mapCategory(['Branding']).category).toBe('graphic')
    expect(mapCategory(['Illustration']).category).toBe('graphic')
    expect(mapCategory(['Typography']).category).toBe('graphic')
    expect(mapCategory(['Print Design']).category).toBe('graphic')
    expect(mapCategory(['Visual Identity']).category).toBe('graphic')
    expect(mapCategory(['Poster Design']).category).toBe('graphic')
    expect(mapCategory(['Packaging']).category).toBe('graphic')
  })

  it('defaults to "graphic" for unmatched fields', () => {
    const result = mapCategory(['Architecture', '3D Art'])
    expect(result.category).toBe('graphic')
    expect(result.matched).toBe(false)
  })

  it('returns matched=true when a keyword matches', () => {
    expect(mapCategory(['Motion Design']).matched).toBe(true)
    expect(mapCategory(['Architecture']).matched).toBe(false)
  })

  it('first match wins when fields span multiple categories', () => {
    const result = mapCategory(['Motion Design', 'Graphic Design'])
    expect(result.category).toBe('motion')
    expect(result.matched).toBe(true)
  })

  it('matching is case-insensitive', () => {
    expect(mapCategory(['MOTION DESIGN']).category).toBe('motion')
    expect(mapCategory(['graphic design']).category).toBe('graphic')
    expect(mapCategory(['Ui/Ux']).category).toBe('product')
  })

  it('returns "graphic" for empty or missing fields array', () => {
    expect(mapCategory([]).category).toBe('graphic')
    expect(mapCategory([]).matched).toBe(false)
    expect(mapCategory(null).category).toBe('graphic')
    expect(mapCategory(undefined).category).toBe('graphic')
  })

  it('matches partial substrings within field names', () => {
    expect(mapCategory(['Motion Design for Film']).category).toBe('video')
    expect(mapCategory(['Advanced Video Editing']).category).toBe('video')
    expect(mapCategory(['Product Design for Apps']).category).toBe('product')
  })
})

describe('translateField', () => {
  it('with lang=pt: pt gets text, en gets TRANSLATE marker', () => {
    const result = translateField('Identidade Visual', 'pt')
    expect(result).toEqual({ pt: 'Identidade Visual', en: 'TRANSLATE:Identidade Visual' })
  })

  it('with lang=en: en gets text, pt gets TRANSLATE marker', () => {
    const result = translateField('Brand Identity', 'en')
    expect(result).toEqual({ en: 'Brand Identity', pt: 'TRANSLATE:Brand Identity' })
  })

  it('defaults to lang=pt', () => {
    const result = translateField('Hello')
    expect(result).toEqual({ pt: 'Hello', en: 'TRANSLATE:Hello' })
  })

  it('handles empty string', () => {
    const result = translateField('', 'pt')
    expect(result).toEqual({ pt: '', en: 'TRANSLATE:' })
  })
})

describe('formatDate', () => {
  it('converts Unix timestamp to YYYY-MM', () => {
    expect(formatDate(1718668800)).toBe('2024-06')
  })

  it('handles Jan 2025', () => {
    expect(formatDate(1735689600)).toBe('2025-01')
  })

  it('handles Nov 2025', () => {
    expect(formatDate(1730419200)).toBe('2024-11')
  })

  it('pads month to 2 digits', () => {
    expect(formatDate(1706745600)).toBe('2024-02')
  })
})

describe('extractSlug', () => {
  it('extracts slug from full Behance gallery URL', () => {
    expect(extractSlug('https://www.behance.net/gallery/123456789/brand-identity-cafe')).toBe(
      'brand-identity-cafe',
    )
  })

  it('extracts slug from URL with trailing slash', () => {
    expect(extractSlug('https://www.behance.net/gallery/123456789/my-project/')).toBe('my-project')
  })

  it('returns the string itself if already a slug', () => {
    expect(extractSlug('my-project-slug')).toBe('my-project-slug')
  })

  it('returns empty string for null/undefined', () => {
    expect(extractSlug(null)).toBe('')
    expect(extractSlug(undefined)).toBe('')
  })

  it('sanitizes percent-encoded segments to filesystem/URL-safe slugs', () => {
    // Regression: %28/%29 in a slug 404'd the eager-glob import in `vite dev`.
    expect(extractSlug('https://www.behance.net/gallery/123/Irup-%28Vitoria-rgia%29')).toBe(
      'Irup-Vitoria-rgia',
    )
  })
})

describe('sanitizeSlug', () => {
  it('decodes percent-encoding and reduces to [A-Za-z0-9-]', () => {
    expect(sanitizeSlug('Infusor-de-cha-Irup-%28Vitoria-rgia%29')).toBe(
      'Infusor-de-cha-Irup-Vitoria-rgia',
    )
  })

  it('strips accents and collapses separators', () => {
    expect(sanitizeSlug('Café Açaí — Design')).toBe('Cafe-Acai-Design')
  })

  it('leaves an already-clean slug unchanged', () => {
    expect(sanitizeSlug('brand-identity-cafe')).toBe('brand-identity-cafe')
  })
})

describe('generateId', () => {
  it('generates p-001 for index 0', () => {
    expect(generateId(0)).toBe('p-001')
  })

  it('generates p-010 for index 9', () => {
    expect(generateId(9)).toBe('p-010')
  })

  it('generates p-100 for index 99', () => {
    expect(generateId(99)).toBe('p-100')
  })

  it('generates p-001 for index 0', () => {
    expect(generateId(0)).toBe('p-001')
  })
})

describe('extractVideoInfo', () => {
  it('extracts YouTube video ID from embed URL', () => {
    expect(extractVideoInfo('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    })
  })

  it('extracts YouTube video ID from watch URL', () => {
    expect(extractVideoInfo('https://www.youtube.com/watch?v=ScMzIvxBSi4')).toEqual({
      provider: 'youtube',
      videoId: 'ScMzIvxBSi4',
    })
  })

  it('extracts Vimeo video ID from embed URL', () => {
    expect(extractVideoInfo('https://player.vimeo.com/video/76979871')).toEqual({
      provider: 'vimeo',
      videoId: '76979871',
    })
  })

  it('extracts Vimeo video ID from standard URL', () => {
    expect(extractVideoInfo('https://vimeo.com/76979871')).toEqual({
      provider: 'vimeo',
      videoId: '76979871',
    })
  })

  it('returns null for unknown provider', () => {
    expect(extractVideoInfo('https://www.dailymotion.com/embed/video/xyz')).toBeNull()
  })

  it('returns null for null/undefined', () => {
    expect(extractVideoInfo(null)).toBeNull()
    expect(extractVideoInfo(undefined)).toBeNull()
  })
})

describe('mapMediaModules', () => {
  it('maps image modules', () => {
    const modules = [{ type: 'image', src: 'https://cdn.behance.net/img1.jpg', caption: 'Logo' }]
    const { media } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(1)
    expect(media[0].type).toBe('image')
    expect(media[0].src).toBe('/images/projects/my-project-1.webp')
    expect(media[0].alt).toEqual({ pt: 'Logo', en: 'TRANSLATE:Logo' })
  })

  it('maps YouTube embed modules', () => {
    const modules = [
      {
        type: 'embed',
        embedUrl: 'https://www.youtube.com/embed/abc12345678',
        videoProvider: null,
        videoId: null,
        caption: 'My Video',
      },
    ]
    const { media } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(1)
    expect(media[0].type).toBe('video')
    expect(media[0].provider).toBe('youtube')
    expect(media[0].videoId).toBe('abc12345678')
  })

  it('maps Vimeo embed modules', () => {
    const modules = [
      {
        type: 'embed',
        embedUrl: 'https://player.vimeo.com/video/123456',
        videoProvider: null,
        videoId: null,
        caption: 'Reel',
      },
    ]
    const { media } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(1)
    expect(media[0].provider).toBe('vimeo')
    expect(media[0].videoId).toBe('123456')
  })

  it('maps video modules with pre-extracted provider info', () => {
    const modules = [
      {
        type: 'video',
        embedUrl: 'https://www.youtube.com/embed/abc12345678',
        videoProvider: 'youtube',
        videoId: 'abc12345678',
        isAdobeCcv: false,
        caption: 'My Video',
      },
    ]
    const { media } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(1)
    expect(media[0].provider).toBe('youtube')
    expect(media[0].videoId).toBe('abc12345678')
  })

  it('maps Adobe CCV video modules as adobe-ccv provider', () => {
    const modules = [
      {
        type: 'video',
        embedUrl: 'https://www-ccv.adobe.io/v1/player/ccv/xyz/embed?api_key=behance1',
        videoProvider: null,
        videoId: null,
        isAdobeCcv: true,
        caption: 'Reel',
      },
    ]
    const { media, skipped } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(1)
    expect(media[0].provider).toBe('adobe-ccv')
    expect(media[0].videoId).toBe(
      'https://www-ccv.adobe.io/v1/player/ccv/xyz/embed?api_key=behance1',
    )
    expect(skipped).toHaveLength(0)
  })

  it('skips text modules silently', () => {
    const modules = [{ type: 'text', text: '<p>Hello</p>' }]
    const { media, skipped } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(0)
    expect(skipped).toHaveLength(0)
  })

  it('skips unknown embed providers and records them', () => {
    const modules = [
      {
        type: 'embed',
        embedUrl: 'https://www.dailymotion.com/embed/video/xyz',
        videoProvider: null,
        videoId: null,
        caption: 'Video',
      },
    ]
    const { media, skipped } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(0)
    expect(skipped).toHaveLength(1)
    expect(skipped[0].type).toBe('embed')
    expect(skipped[0].reason).toContain('Unsupported')
  })

  it('skips image modules with no src', () => {
    const modules = [{ type: 'image', src: null }]
    const { media } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(0)
  })

  it('skips embed modules with no embedUrl', () => {
    const modules = [{ type: 'embed', embedUrl: null }]
    const { media } = mapMediaModules(modules, 'my-project', 'pt')
    expect(media).toHaveLength(0)
  })

  it('numbers gallery images sequentially', () => {
    const modules = [
      { type: 'image', src: 'https://cdn.behance.net/img1.jpg', caption: 'A' },
      { type: 'text', text: '<p>skip me</p>' },
      { type: 'image', src: 'https://cdn.behance.net/img2.jpg', caption: 'B' },
    ]
    const { media } = mapMediaModules(modules, 'proj', 'pt')
    expect(media).toHaveLength(2)
    expect(media[0].src).toBe('/images/projects/proj-1.webp')
    expect(media[1].src).toBe('/images/projects/proj-2.webp')
  })

  it('uses slug as fallback caption for images without caption', () => {
    const modules = [{ type: 'image', src: 'https://cdn.behance.net/img1.jpg' }]
    const { media } = mapMediaModules(modules, 'my-proj', 'pt')
    expect(media[0].alt).toEqual({ pt: 'my-proj', en: 'TRANSLATE:my-proj' })
  })

  it('returns empty arrays for null/undefined modules', () => {
    const result = mapMediaModules(null, 'slug', 'pt')
    expect(result.media).toEqual([])
    expect(result.skipped).toEqual([])
  })
})

describe('mapProject', () => {
  const sampleProject = {
    name: 'Identidade — Café Aurora',
    url: 'https://www.behance.net/gallery/123456789/identidade-cafe-aurora',
    description: 'Full visual identity for a coffee shop.',
    published_on: 1718668800,
    fields: ['Graphic Design', 'Branding'],
    covers: {
      original: 'https://mir-s3-cdn-cf.behance.net/projects/original/abc.jpg',
      '404': 'https://mir-s3-cdn-cf.behance.net/projects/404/abc.jpg',
    },
    modules: [
      { type: 'image', src: 'https://cdn.behance.net/img1.jpg', caption: 'Logo design' },
      { type: 'embed', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Process' },
    ],
    tools: [{ title: 'Illustrator' }, { title: 'Photoshop' }],
  }

  it('maps a full project with all fields', () => {
    const { project, meta } = mapProject(sampleProject, 0, 'pt')
    expect(project.id).toBe('p-001')
    expect(project.slug).toBe('identidade-cafe-aurora')
    expect(project.category).toBe('graphic')
    expect(project.title).toEqual({ pt: 'Identidade — Café Aurora', en: 'TRANSLATE:Identidade — Café Aurora' })
    expect(project.description).toEqual({
      pt: 'Full visual identity for a coffee shop.',
      en: 'TRANSLATE:Full visual identity for a coffee shop.',
    })
    expect(project.thumbnail.src).toBe('/images/projects/identidade-cafe-aurora-thumb.webp')
    expect(project.date).toBe('2024-06')
    expect(project.featured).toBe(false)
    expect(project.tools).toEqual(['Illustrator', 'Photoshop'])
    expect(project.media).toHaveLength(2)
    expect(project.links).toHaveLength(1)
    expect(project.links[0].url).toBe(sampleProject.url)
    expect(project.links[0].label).toEqual({ pt: 'Ver no Behance', en: 'View on Behance' })
    expect(meta.coverUrl).toBe(sampleProject.covers.original)
    expect(meta.warnings).toHaveLength(0)
  })

  it('generates TRANSLATE markers in en when lang=pt', () => {
    const { project } = mapProject(sampleProject, 0, 'pt')
    expect(project.title.en).toContain('TRANSLATE:')
    expect(project.title.pt).not.toContain('TRANSLATE:')
  })

  it('generates TRANSLATE markers in pt when lang=en', () => {
    const { project } = mapProject(sampleProject, 0, 'en')
    expect(project.title.pt).toContain('TRANSLATE:')
    expect(project.title.en).not.toContain('TRANSLATE:')
  })

  it('falls back through cover sizes', () => {
    const noOriginal = { ...sampleProject, covers: { '404': 'https://cdn/404.jpg' } }
    const { meta } = mapProject(noOriginal, 0, 'pt')
    expect(meta.coverUrl).toBe('https://cdn/404.jpg')
  })

  it('handles missing covers gracefully', () => {
    const noCovers = { ...sampleProject, covers: {} }
    const { meta } = mapProject(noCovers, 0, 'pt')
    expect(meta.coverUrl).toBe('')
  })

  it('handles string tools (not objects)', () => {
    const stringTools = { ...sampleProject, tools: ['Figma', 'Sketch'] }
    const { project } = mapProject(stringTools, 0, 'pt')
    expect(project.tools).toEqual(['Figma', 'Sketch'])
  })

  it('handles missing optional fields', () => {
    const minimal = {
      name: 'Minimal Project',
      url: 'https://www.behance.net/gallery/111/minimal-project',
      description: '',
      published_on: 1735689600,
      fields: [],
    }
    const { project, meta } = mapProject(minimal, 2, 'pt')
    expect(project.id).toBe('p-003')
    expect(project.category).toBe('graphic')
    expect(project.tools).toEqual([])
    expect(project.media).toEqual([])
    expect(project.links).toHaveLength(1)
    expect(meta.warnings).toHaveLength(1)
    expect(meta.warnings[0].field).toBe('category')
  })

  it('records skipped modules in meta', () => {
    const withSkipped = {
      ...sampleProject,
      modules: [
        ...sampleProject.modules,
        { type: 'embed', embedUrl: 'https://dailymotion.com/embed/video/xyz', title: 'DM' },
      ],
    }
    const { meta } = mapProject(withSkipped, 0, 'pt')
    expect(meta.skippedModules).toHaveLength(1)
    expect(meta.skippedModules[0].reason).toContain('Unsupported')
  })

  it('generates slug from URL', () => {
    const { project } = mapProject(sampleProject, 0, 'pt')
    expect(project.slug).toBe('identidade-cafe-aurora')
  })

  it('falls back slug to project-N when URL has no slug', () => {
    const noSlug = { ...sampleProject, url: 'https://www.behance.net/gallery/123/' }
    const { project } = mapProject(noSlug, 3, 'pt')
    expect(project.slug).toBe('project-4')
  })
})

describe('mapProfile', () => {
  const sampleUser = {
    displayName: 'João Kalaf',
    username: 'joaokalaf',
    bio: 'Designer multidisciplinar com atuação em vídeo e marca.',
    socialLinks: [
      { service: 'Instagram', url: 'https://instagram.com/joaokalaf' },
      { service: 'LinkedIn', url: 'https://linkedin.com/in/joaokalaf' },
    ],
    location: 'São Paulo, Brazil',
  }

  it('maps a full user profile', () => {
    const profile = mapProfile(sampleUser, 'pt')
    expect(profile.name).toBe('João Kalaf')
    expect(profile.bio.pt).toBe('Designer multidisciplinar com atuação em vídeo e marca.')
    expect(profile.bio.en).toContain('TRANSLATE:')
    expect(profile.email).toBe('')
    expect(profile.photo).toBeNull()
  })

  it('maps social links', () => {
    const profile = mapProfile(sampleUser, 'pt')
    expect(profile.socials).toHaveLength(2)
    expect(profile.socials[0]).toEqual({ label: 'Instagram', url: 'https://instagram.com/joaokalaf' })
  })

  it('generates 4 services from category enum', () => {
    const profile = mapProfile(sampleUser, 'pt')
    expect(profile.services).toHaveLength(4)
    const ids = profile.services.map((s) => s.id)
    expect(ids).toEqual(['video', 'motion', 'product', 'graphic'])
    for (const s of profile.services) {
      expect(s.name).toHaveProperty('pt')
      expect(s.name).toHaveProperty('en')
      expect(s.blurb).toHaveProperty('pt')
      expect(s.blurb).toHaveProperty('en')
    }
  })

  it('handles missing bio', () => {
    const noBio = { ...sampleUser, bio: null }
    const profile = mapProfile(noBio, 'pt')
    expect(profile.bio).toEqual({ pt: '', en: '' })
  })

  it('handles missing social links', () => {
    const noSocials = { ...sampleUser, socialLinks: null }
    const profile = mapProfile(noSocials, 'pt')
    expect(profile.socials).toEqual([])
  })

  it('generates tagline from first sentence of bio', () => {
    const profile = mapProfile(sampleUser, 'pt')
    expect(profile.tagline.pt).toBeTruthy()
    expect(profile.tagline.en).toContain('TRANSLATE:')
  })

  it('handles empty bio for tagline', () => {
    const noBio = { ...sampleUser, bio: '' }
    const profile = mapProfile(noBio, 'pt')
    expect(profile.tagline).toEqual({ pt: '', en: '' })
  })
})

describe('CATEGORY_MAP structure', () => {
  it('has entries for all four portfolio categories', () => {
    const categories = CATEGORY_MAP.map((e) => e.category)
    expect(categories).toContain('video')
    expect(categories).toContain('motion')
    expect(categories).toContain('product')
    expect(categories).toContain('graphic')
  })

  it('each entry has keywords array and category string', () => {
    for (const entry of CATEGORY_MAP) {
      expect(entry).toHaveProperty('keywords')
      expect(entry).toHaveProperty('category')
      expect(Array.isArray(entry.keywords)).toBe(true)
      expect(entry.keywords.length).toBeGreaterThan(0)
      expect(typeof entry.category).toBe('string')
    }
  })
})
