import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  CATEGORIES,
  loadProjects,
  loadProfile,
  getProjects,
  getProjectsByCategory,
  getProfile,
} from './projects.js'

const text = (value) => ({ pt: value, en: value })

function makeProject(overrides = {}) {
  return {
    id: 'p-100',
    slug: 'projeto-valido',
    category: 'video',
    title: text('Projeto'),
    description: text('Descrição'),
    thumbnail: { src: '/images/projects/x.svg', alt: text('Alt') },
    media: [{ type: 'image', src: '/images/projects/x.svg', alt: text('Alt') }],
    tools: ['Figma'],
    date: '2026-01',
    featured: false,
    links: [],
    ...overrides,
  }
}

const strict = { strict: true }
const lenient = { strict: false }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CATEGORIES', () => {
  it('is the canonical enum from the content model', () => {
    expect(CATEGORIES).toEqual(['video', 'motion', 'product', 'graphic'])
  })
})

describe('loadProjects — validation', () => {
  it('accepts a valid project', () => {
    expect(loadProjects([makeProject()], strict)).toHaveLength(1)
  })

  it.each([
    ['unknown category', { category: 'painting' }],
    ['bad date format', { date: '2026-1' }],
    ['missing en title', { title: { pt: 'Só português', en: '' } }],
    ['empty media', { media: [] }],
    ['image media without alt', { media: [{ type: 'image', src: '/x.svg' }] }],
    [
      'video media without videoId',
      { media: [{ type: 'video', provider: 'youtube', title: text('T') }] },
    ],
    ['unknown media type', { media: [{ type: 'gif', src: '/x.gif' }] }],
    ['thumbnail without alt', { thumbnail: { src: '/x.svg' } }],
    [
      'unknown video provider',
      { media: [{ type: 'video', provider: 'dailymotion', videoId: 'x', title: text('T') }] },
    ],
  ])('rejects %s in strict mode', (_name, overrides) => {
    expect(() => loadProjects([makeProject(overrides)], strict)).toThrow(/p-100/)
  })

  it('rejects duplicate slugs', () => {
    const a = makeProject({ id: 'p-100' })
    const b = makeProject({ id: 'p-101' })
    expect(() => loadProjects([a, b], strict)).toThrow(/slug: duplicate/)
  })

  it('names the offending record and field in the error', () => {
    expect(() => loadProjects([makeProject({ date: 'nope' })], strict)).toThrow(
      /"p-100".*date: must match YYYY-MM/,
    )
  })

  it('skips invalid records and keeps valid ones in non-strict mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = makeProject({ id: 'p-bad', slug: 'bad', category: 'nope' })
    const good = makeProject()
    const result = loadProjects([bad, good], lenient)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p-100')
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('loadProjects — description is optional copy', () => {
  // A partial description (one language) is legitimate and must not break the
  // build — pick() falls back. Regression for a CMS one-language edit.
  it.each([
    ['both empty', { pt: '', en: '' }],
    ['only pt', { pt: 'Testando', en: '' }],
    ['only en', { pt: '', en: 'Testing' }],
    ['both filled', { pt: 'A', en: 'B' }],
    ['absent', undefined],
  ])('accepts %s', (_name, description) => {
    expect(loadProjects([makeProject({ description })], strict)).toHaveLength(1)
  })

  it('rejects a malformed (non-string) description', () => {
    expect(() => loadProjects([makeProject({ description: { pt: 5, en: 'x' } })], strict)).toThrow(
      /description: pt and en must be strings/,
    )
  })
})

describe('loadProjects — ordering', () => {
  it('sorts newest-first by date', () => {
    const result = loadProjects(
      [
        makeProject({ id: 'a', slug: 'a', date: '2025-03' }),
        makeProject({ id: 'b', slug: 'b', date: '2026-05' }),
        makeProject({ id: 'c', slug: 'c', date: '2025-11' }),
      ],
      strict,
    )
    expect(result.map((p) => p.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('loadProfile', () => {
  function makeProfile(overrides = {}) {
    return {
      name: 'Nome',
      tagline: text('Tagline'),
      bio: text('Bio'),
      services: CATEGORIES.map((id) => ({ id, name: text(id), blurb: text('Blurb') })),
      email: 'a@b.com',
      socials: [{ label: 'Behance', url: 'https://behance.net' }],
      photo: null,
      ...overrides,
    }
  }

  it('accepts a valid profile', () => {
    expect(() => loadProfile(makeProfile(), strict)).not.toThrow()
  })

  it('requires exactly one service per category', () => {
    const missing = makeProfile({ services: makeProfile().services.slice(0, 3) })
    expect(() => loadProfile(missing, strict)).toThrow(/services/)
  })

  it('warns but still returns the profile in non-strict mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const invalid = makeProfile({ email: 'not-an-email' })
    expect(loadProfile(invalid, lenient)).toBe(invalid)
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('seed data integration', () => {
  it('ships valid projects covering all categories', () => {
    const projects = getProjects()
    expect(projects.length).toBeGreaterThan(0)
    for (const category of CATEGORIES) {
      expect(getProjectsByCategory(category).length).toBeGreaterThan(0)
    }
  })

  it('is sorted newest-first', () => {
    const dates = getProjects().map((p) => p.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('throws on an unknown category in dev', () => {
    expect(() => getProjectsByCategory('painting')).toThrow(/Unknown category/)
  })

  it('ships a valid profile', () => {
    expect(getProfile().services).toHaveLength(4)
  })
})
