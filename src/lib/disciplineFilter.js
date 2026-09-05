/**
 * Discipline-filter state is stored in the URL hash, so a filtered showcase is
 * shareable without a router: `#work/motion` selects the motion discipline.
 */
import { useSyncExternalStore } from 'react'
import { DISCIPLINE_IDS } from './projects.js'

function disciplineIds(disciplines) {
  return disciplines.map((discipline) =>
    typeof discipline === 'string' ? discipline : discipline.id,
  )
}

export function parseDisciplineFromHash(hash, disciplines = DISCIPLINE_IDS) {
  const match = /^#work\/([\w-]+)$/.exec(hash ?? '')
  return match && disciplineIds(disciplines).includes(match[1]) ? match[1] : 'all'
}

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useDisciplineFilter(disciplines = DISCIPLINE_IDS) {
  const discipline = useSyncExternalStore(subscribe, () =>
    parseDisciplineFromHash(window.location.hash, disciplines),
  )

  const setDiscipline = (next) => {
    window.history.replaceState(null, '', next === 'all' ? '#work' : `#work/${next}`)
    window.dispatchEvent(new Event('hashchange'))
  }

  return [discipline, setDiscipline]
}
