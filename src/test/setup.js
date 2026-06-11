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
