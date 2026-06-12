import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest runs without injected globals, so Testing Library's automatic
// afterEach cleanup never registers — do it explicitly.
afterEach(cleanup)

// jsdom doesn't implement the <dialog> modal API (all target browsers do).
// Minimal polyfill: toggling `open` is enough for rendering and role=dialog.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

// Mirror index.html's <meta name="description"> so the document-title effect
// (App's Page) has an element to update under test, like the real head.
if (typeof document !== 'undefined' && !document.querySelector('meta[name="description"]')) {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'description')
  document.head.appendChild(meta)
}

// jsdom has no IntersectionObserver — the scroll-reveal hook (useInView) needs
// one. This mock reports every observed element as immediately in view, so
// sections render revealed and the App smoke tests stay agnostic to motion.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback
    }
    observe(target) {
      this.callback([{ isIntersecting: true, target }], this)
    }
    unobserve() {}
    disconnect() {}
  }
}

// jsdom has no matchMedia; useInView reads prefers-reduced-motion through it.
// Default to "no preference" so the reveal path is exercised under test.
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })
}
