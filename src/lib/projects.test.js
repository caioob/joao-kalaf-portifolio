import { describe, expect, it } from 'vitest'
import {
  DISCIPLINE_IDS,
  getPortfolio,
  getProfile,
  getProjects,
  getProjectsByDiscipline,
  getVisibleDisciplines,
} from './projects.js'

describe('portfolio repository integration', () => {
  it('ships ranked showcase projects with a dynamic visible discipline catalog', () => {
    const projects = getProjects()

    expect(projects.length).toBeGreaterThan(0)
    expect(projects.map((project) => project.rank)).toEqual(
      [...projects.map((project) => project.rank)].sort((a, b) => a - b),
    )
    expect(getVisibleDisciplines().map((discipline) => discipline.id)).toEqual(DISCIPLINE_IDS)
  })

  it('filters projects by their primary discipline only', () => {
    const disciplineId = DISCIPLINE_IDS[0]

    expect(getProjectsByDiscipline(disciplineId)).toEqual(
      getProjects().filter((project) => project.primaryDisciplineId === disciplineId),
    )
    expect(() => getProjectsByDiscipline('painting')).toThrow(/Unknown discipline/)
  })

  it('has no publication blockers in the production dataset', () => {
    expect(getPortfolio().previewChecklist).toEqual([])
    expect(getProfile()).toMatchObject({ name: expect.any(String), logo: expect.any(String) })
  })
})
