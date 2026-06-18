import { describe, it } from 'vitest'
import { loadProjects, loadProfile } from './projects.js'
import rawProfile from '../../content/profile.json'

// Guard: every real content file must pass STRICT validation. Catches a bad
// client edit (e.g. a half-translated required field, a missing image) before it
// ships — loadProjects/loadProfile throw on the first invalid record, naming it.
const projectModules = import.meta.glob('../../content/projects/*.json', { eager: true })
const rawProjects = Object.values(projectModules).map((m) => m.default ?? m)

describe('content/ is valid', () => {
  it('every project passes strict validation', () => {
    loadProjects(rawProjects, { strict: true })
  })

  it('the profile passes strict validation', () => {
    loadProfile(rawProfile, { strict: true })
  })
})
