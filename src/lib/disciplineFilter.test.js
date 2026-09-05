import { describe, expect, it } from 'vitest'
import { parseDisciplineFromHash } from './disciplineFilter.js'

describe('parseDisciplineFromHash', () => {
  it('accepts only an active discipline from the supplied catalog', () => {
    const disciplines = [{ id: 'motion' }, { id: 'graphic' }]

    expect(parseDisciplineFromHash('#work/motion', disciplines)).toBe('motion')
    expect(parseDisciplineFromHash('#work/video', disciplines)).toBe('all')
  })

  it('falls back to all for a malformed hash', () => {
    expect(parseDisciplineFromHash('#project/a-project', ['motion'])).toBe('all')
  })
})
