import { describe, it } from 'vitest'
import { loadPortfolio, loadPortfolioProfile } from './projects.js'
import rawProfile from '../../content/profile.json'
import rawDisciplineCatalog from '../../content/disciplines.json'

// Guard: every real content file must pass STRICT validation. Catches a bad
// client edit (e.g. a half-translated required field, a missing image) before it
// ships — the loaders throw on the first invalid record, naming it.
const projectModules = import.meta.glob('../../content/projects/*.json', { eager: true })
const rawProjects = Object.values(projectModules).map((m) => m.default ?? m)

describe('content/ is valid', () => {
  it('every project and discipline passes strict publication validation', () => {
    loadPortfolio(
      { projects: rawProjects, disciplines: rawDisciplineCatalog.disciplines },
      { strict: true },
    )
  })

  it('the profile passes strict validation', () => {
    loadPortfolioProfile(rawProfile, { strict: true })
  })
})
