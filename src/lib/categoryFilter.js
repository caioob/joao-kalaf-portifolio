/**
 * Category filter state, stored in the URL hash so filtered views are
 * shareable (spec FR-1, architecture §5): "#work/motion" → 'motion'.
 * Plain "#work" (or anything unrecognized) means 'all'.
 */
import { useSyncExternalStore } from 'react'
import { CATEGORIES } from './projects.js'

/** @returns {'all' | import('./types').Project['category']} */
export function parseCategoryFromHash(hash) {
  const match = /^#work\/([\w-]+)$/.exec(hash ?? '')
  return match && CATEGORIES.includes(match[1]) ? match[1] : 'all'
}

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getSnapshot() {
  return parseCategoryFromHash(window.location.hash)
}

/** @returns {[string, (category: string) => void]} */
export function useCategoryFilter() {
  const category = useSyncExternalStore(subscribe, getSnapshot)

  // replaceState instead of assigning location.hash: updates the URL without
  // scroll-jumping to the #work anchor on every pill click. replaceState
  // fires no hashchange event, so notify the store manually.
  const setCategory = (next) => {
    window.history.replaceState(null, '', next === 'all' ? '#work' : `#work/${next}`)
    window.dispatchEvent(new Event('hashchange'))
  }

  return [category, setCategory]
}
