import { useSyncExternalStore } from 'react'

export function parseProjectSlugFromHash(hash) {
  return /^#project\/([^/]+)$/.exec(hash ?? '')?.[1] ?? null
}

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  window.addEventListener('popstate', callback)
  return () => {
    window.removeEventListener('hashchange', callback)
    window.removeEventListener('popstate', callback)
  }
}

function notifyLocationChange() {
  window.dispatchEvent(new Event('hashchange'))
}

export function useProjectDeepLink(projects) {
  const slug = useSyncExternalStore(subscribe, () => parseProjectSlugFromHash(window.location.hash))
  return projects.find((project) => project.slug === slug) ?? null
}

export function openProjectDeepLink(project) {
  window.history.pushState(null, '', `#project/${project.slug}`)
  notifyLocationChange()
}

export function closeProjectDeepLink() {
  window.history.pushState(null, '', '#work')
  notifyLocationChange()
}
