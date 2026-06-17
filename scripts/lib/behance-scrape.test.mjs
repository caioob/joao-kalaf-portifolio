// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  parseProfileUrl,
  normalizeProject,
  normalizeUser,
  extractEmbedUrl,
} from './behance-scrape.mjs'

describe('parseProfileUrl', () => {
  it('extracts username from full URL', () => {
    expect(parseProfileUrl('https://www.behance.net/joaokalaf')).toEqual({
      username: 'joaokalaf',
      profileUrl: 'https://www.behance.net/joaokalaf',
    })
  })

  it('handles trailing slash', () => {
    expect(parseProfileUrl('https://www.behance.net/joaokalaf/')).toEqual({
      username: 'joaokalaf',
      profileUrl: 'https://www.behance.net/joaokalaf',
    })
  })

  it('handles /projects suffix', () => {
    expect(parseProfileUrl('https://www.behance.net/joaokalaf/projects')).toEqual({
      username: 'joaokalaf',
      profileUrl: 'https://www.behance.net/joaokalaf',
    })
  })

  it('handles just username as input', () => {
    expect(parseProfileUrl('joaokalaf')).toEqual({
      username: 'joaokalaf',
      profileUrl: 'https://www.behance.net/joaokalaf',
    })
  })

  it('throws on invalid input', () => {
    expect(() => parseProfileUrl('')).toThrow()
    expect(() => parseProfileUrl(null)).toThrow()
  })
})

describe('normalizeProject', () => {
  const rawProject = {
    id: 123456789,
    name: 'Brand Identity',
    url: 'https://www.behance.net/gallery/123456789/brand-identity',
    description: 'A full brand identity project.',
    published_on: 1718668800,
    fields: ['Graphic Design', 'Branding'],
    covers: {
      original: 'https://mir-s3-cdn-cf.behance.net/projects/original/abc.jpg',
      '404': 'https://mir-s3-cdn-cf.behance.net/projects/404/abc.jpg',
    },
    modules: [
      {
        type: 'image',
        src: 'https://mir-s3-cdn-cf.behance.net/project_modules/img1.jpg',
        caption: 'Logo',
      },
      {
        type: 'embed',
        embed: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="500"></iframe>',
        original_embed: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
    tools: [{ title: 'Illustrator' }, { title: 'Photoshop' }],
  }

  it('normalizes a full raw project', () => {
    const normalized = normalizeProject(rawProject)
    expect(normalized.name).toBe('Brand Identity')
    expect(normalized.url).toBe('https://www.behance.net/gallery/123456789/brand-identity')
    expect(normalized.fields).toEqual(['Graphic Design', 'Branding'])
    expect(normalized.covers.original).toBeTruthy()
    expect(normalized.modules).toHaveLength(2)
  })

  it('extracts embed URL from iframe markup', () => {
    const normalized = normalizeProject(rawProject)
    const embedModule = normalized.modules.find((m) => m.type === 'embed')
    expect(embedModule.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('uses original_embed as fallback for embedUrl', () => {
    const project = {
      ...rawProject,
      modules: [
        {
          type: 'embed',
          original_embed: 'https://vimeo.com/76979871',
          embed: '<div>some html</div>',
        },
      ],
    }
    const normalized = normalizeProject(project)
    expect(normalized.modules[0].embedUrl).toBe('https://vimeo.com/76979871')
  })

  it('handles missing modules', () => {
    const noModules = { ...rawProject, modules: undefined }
    const normalized = normalizeProject(noModules)
    expect(normalized.modules).toEqual([])
  })

  it('handles missing covers', () => {
    const noCovers = { ...rawProject, covers: undefined }
    const normalized = normalizeProject(noCovers)
    expect(normalized.covers.original).toBe('')
  })

  it('strips HTML from description', () => {
    const htmlDesc = { ...rawProject, description: '<p>Hello <b>world</b></p>' }
    const normalized = normalizeProject(htmlDesc)
    expect(normalized.description).toBe('Hello world')
  })

  it('normalizes be-state project with __typename modules', () => {
    const beStateProject = {
      project: {
        name: 'Zoho - Event Film',
        url: 'https://www.behance.net/gallery/250717465/Zoho',
        description: '',
        publishedOn: 1780881982,
        tags: [
          { id: 1, title: 'motion graphics' },
          { id: 2, title: 'video editing' },
        ],
        covers: {
          size_original_webp: {
            url: 'https://mir-s3-cdn-cf.behance.net/projects/original_webp/abc.webp',
          },
          allAvailable: [],
        },
        modules: [
          {
            __typename: 'ImageModule',
            src: 'https://mir-s3-cdn-cf.behance.net/project_modules/disp/abc.jpg',
            imageSizes: { size_disp: { url: 'https://cdn/large.jpg', width: 1400 } },
            caption: '',
            altText: 'Project image',
          },
          {
            __typename: 'VideoModule',
            embed: '<iframe src="https://www-ccv.adobe.io/v1/player/ccv/xyz/embed?api_key=behance1"></iframe>',
            caption: '',
          },
          {
            __typename: 'TextModule',
            text: '<p>Some description text</p>',
          },
        ],
        tools: [{ id: 1, title: 'Adobe Premiere Pro' }, { id: 2, title: 'After Effects' }],
      },
    }
    const normalized = normalizeProject(beStateProject)
    expect(normalized.name).toBe('Zoho - Event Film')
    expect(normalized.published_on).toBe(1780881982)
    expect(normalized.fields).toEqual(['motion graphics', 'video editing'])
    expect(normalized.covers.original).toBe(
      'https://mir-s3-cdn-cf.behance.net/projects/original_webp/abc.webp',
    )
    expect(normalized.tools).toEqual(['Adobe Premiere Pro', 'After Effects'])
    expect(normalized.modules).toHaveLength(3)
    expect(normalized.modules[0].type).toBe('image')
    expect(normalized.modules[1].type).toBe('video')
    expect(normalized.modules[1].isAdobeCcv).toBe(true)
    expect(normalized.modules[2].type).toBe('text')
  })

  it('extracts cover URL from allAvailable array', () => {
    const project = {
      ...rawProject,
      covers: {
        allAvailable: [
          { url: 'https://cdn/original_webp/abc.webp' },
          { url: 'https://cdn/808/abc.jpg', width: 808 },
        ],
      },
    }
    const normalized = normalizeProject(project)
    expect(normalized.covers.original).toBe('https://cdn/original_webp/abc.webp')
  })

  it('uses tags as fields fallback when fields is null', () => {
    const project = {
      ...rawProject,
      fields: null,
      tags: [{ id: 1, title: 'branding' }, { id: 2, title: 'illustration' }],
    }
    const normalized = normalizeProject(project)
    expect(normalized.fields).toEqual(['branding', 'illustration'])
  })

  it('extracts best image from imageSizes', () => {
    const project = {
      ...rawProject,
      modules: [
        {
          __typename: 'ImageModule',
          src: '',
          imageSizes: {
            size_1400: { url: 'https://cdn/1400.jpg', width: 1400 },
            size_600: { url: 'https://cdn/600.jpg', width: 600 },
          },
          caption: 'Detail',
        },
      ],
    }
    const normalized = normalizeProject(project)
    expect(normalized.modules[0].src).toBe('https://cdn/1400.jpg')
  })

  it('picks the widest render from allAvailable over the small disp in mod.src', () => {
    // Real be-state shape: named size_* keys are null / url-less; the
    // downloadable width-tagged URLs (incl. full-res `source`) are in allAvailable.
    const project = {
      ...rawProject,
      modules: [
        {
          __typename: 'ImageModule',
          src: 'https://cdn/project_modules/disp/abc.jpg',
          imageSizes: {
            size_disp: { url: 'https://cdn/project_modules/disp/abc.jpg', width: 600, height: 480 },
            size_1400: null,
            size_max_1200: { width: 1200, height: 960 },
            allAvailable: [
              { url: 'https://cdn/project_modules/source/abc.jpg', width: 1920, type: 'JPG' },
              { url: 'https://cdn/project_modules/max_632/abc.jpg', width: 790, type: 'JPG' },
            ],
          },
          caption: 'Detail',
        },
      ],
    }
    const normalized = normalizeProject(project)
    expect(normalized.modules[0].src).toBe('https://cdn/project_modules/source/abc.jpg')
  })

  it('falls back to mod.src when no imageSizes are present (DOM scrape)', () => {
    const project = {
      ...rawProject,
      modules: [{ __typename: 'ImageModule', src: 'https://cdn/dom-image.jpg', caption: '' }],
    }
    const normalized = normalizeProject(project)
    expect(normalized.modules[0].src).toBe('https://cdn/dom-image.jpg')
  })
})

describe('normalizeUser', () => {
  const rawUser = {
    user: {
      display_name: 'João Kalaf',
      username: 'joaokalaf',
      sections: {
        'About Me': 'I am a multidisciplinary designer.',
        Bio: 'Designer working across video, motion and brand.',
      },
      social_links: [
        { service: 'Instagram', url: 'https://instagram.com/joaokalaf' },
        { service: 'LinkedIn', url: 'https://linkedin.com/in/joaokalaf' },
      ],
      location: 'São Paulo, Brazil',
    },
  }

  it('normalizes a full raw user', () => {
    const normalized = normalizeUser(rawUser)
    expect(normalized.displayName).toBe('João Kalaf')
    expect(normalized.username).toBe('joaokalaf')
    expect(normalized.bio).toBeTruthy()
    expect(normalized.socialLinks).toHaveLength(2)
    expect(normalized.location).toBe('São Paulo, Brazil')
  })

  it('picks bio from sections', () => {
    const normalized = normalizeUser(rawUser)
    expect(typeof normalized.bio).toBe('string')
    expect(normalized.bio.length).toBeGreaterThan(0)
  })

  it('handles missing sections', () => {
    const noSections = { user: { display_name: 'Test', username: 'test', sections: {} } }
    const normalized = normalizeUser(noSections)
    expect(normalized.bio).toBeNull()
  })

  it('handles missing social links', () => {
    const noSocials = { user: { display_name: 'Test', username: 'test', social_links: undefined } }
    const normalized = normalizeUser(noSocials)
    expect(normalized.socialLinks).toEqual([])
  })

  it('normalizes be-state user with displayName and occupation', () => {
    const beStateUser = {
      user: {
        displayName: 'João Kalaf',
        username: 'joaokalaf',
        occupation: 'Motion Designer / Videomaker / Artist',
        location: 'Brazil',
        socialReferences: [],
      },
    }
    const normalized = normalizeUser(beStateUser)
    expect(normalized.displayName).toBe('João Kalaf')
    expect(normalized.bio).toBe('Motion Designer / Videomaker / Artist')
    expect(normalized.location).toBe('Brazil')
  })

  it('uses socialReferences when social_links is absent', () => {
    const beStateUser = {
      user: {
        displayName: 'Test',
        socialReferences: [
          { service: 'Instagram', url: 'https://instagram.com/test' },
        ],
      },
    }
    const normalized = normalizeUser(beStateUser)
    expect(normalized.socialLinks).toHaveLength(1)
    expect(normalized.socialLinks[0].service).toBe('Instagram')
  })

  it('falls back to customSections text for bio', () => {
    const user = {
      user: {
        displayName: 'Test',
        customSections: [{ title: 'About', text: 'Custom bio text' }],
      },
    }
    const normalized = normalizeUser(user)
    expect(normalized.bio).toBe('Custom bio text')
  })
})

describe('extractEmbedUrl', () => {
  it('extracts URL from iframe src', () => {
    expect(extractEmbedUrl('<iframe src="https://www.youtube.com/embed/abc" ></iframe>')).toBe(
      'https://www.youtube.com/embed/abc',
    )
  })

  it('extracts URL with double quotes', () => {
    expect(extractEmbedUrl('<iframe src="https://player.vimeo.com/video/123" width="500">')).toBe(
      'https://player.vimeo.com/video/123',
    )
  })

  it('returns null for non-iframe HTML', () => {
    expect(extractEmbedUrl('<div>not an iframe</div>')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(extractEmbedUrl(null)).toBeNull()
  })
})
