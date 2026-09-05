import { describe, expect, it } from 'vitest'
import { loadPortfolio } from './projects.js'

const localized = (value) => ({ pt: value, en: value })

function makeDiscipline(overrides = {}) {
  return {
    id: 'motion',
    label: localized('Motion'),
    rank: 1,
    archived: false,
    ...overrides,
  }
}

function makeProject(overrides = {}) {
  return {
    id: 'p-001',
    slug: 'projeto-motion',
    rank: 2,
    primaryDisciplineId: 'motion',
    secondaryDisciplineIds: [],
    title: localized('Projeto'),
    description: localized('Descrição'),
    coverMediaId: 'cover',
    media: [
      {
        id: 'cover',
        type: 'image',
        src: '/images/projects/cover.webp',
        alt: localized('Capa'),
        width: 1600,
        height: 1000,
      },
    ],
    ...overrides,
  }
}

describe('loadPortfolio', () => {
  it('returns ranked projects and only disciplines used as a published primary discipline', () => {
    const portfolio = loadPortfolio(
      {
        disciplines: [makeDiscipline({ id: 'motion', rank: 2 }), makeDiscipline({ id: 'graphic' })],
        projects: [
          makeProject({ id: 'p-002', slug: 'second', rank: 2 }),
          makeProject({ id: 'p-001', slug: 'first', rank: 1 }),
        ],
      },
      { strict: true },
    )

    expect(portfolio.projects.map((project) => project.id)).toEqual(['p-001', 'p-002'])
    expect(portfolio.visibleDisciplines.map((discipline) => discipline.id)).toEqual(['motion'])
  })

  it('keeps incomplete projects visible in preview validation with publication blockers', () => {
    const portfolio = loadPortfolio(
      {
        disciplines: [makeDiscipline()],
        projects: [makeProject({ title: { pt: 'Só português', en: '' } })],
      },
      { strict: false, preview: true },
    )

    expect(portfolio.projects).toHaveLength(1)
    expect(portfolio.previewChecklist).toEqual([
      {
        projectId: 'p-001',
        blockers: expect.arrayContaining(['title: requires non-empty pt and en']),
      },
    ])
  })

  it('rejects a non-kebab Project Slug from the published schema', () => {
    expect(() =>
      loadPortfolio(
        { disciplines: [makeDiscipline()], projects: [makeProject({ slug: 'Projeto Especial' })] },
        { strict: true },
      ),
    ).toThrow(/slug: must be kebab-case/)
  })

  it('requires one unique showcase rank for each project', () => {
    expect(() =>
      loadPortfolio(
        {
          disciplines: [makeDiscipline()],
          projects: [makeProject(), makeProject({ id: 'p-002', slug: 'second-project' })],
        },
        { strict: true },
      ),
    ).toThrow(/rank: duplicate/)
  })

  it('rejects an out-of-bounds cover focal point', () => {
    expect(() =>
      loadPortfolio(
        {
          disciplines: [makeDiscipline()],
          projects: [
            makeProject({
              media: [
                {
                  ...makeProject().media[0],
                  focalPoint: { x: 120, y: 50 },
                },
              ],
            }),
          ],
        },
        { strict: true },
      ),
    ).toThrow(/focalPoint/)
  })

  it('requires projects to be reassigned before a discipline is archived', () => {
    expect(() =>
      loadPortfolio(
        {
          disciplines: [makeDiscipline({ archived: true })],
          projects: [makeProject()],
        },
        { strict: true },
      ),
    ).toThrow(/must not reference an archived discipline/)
  })
})
