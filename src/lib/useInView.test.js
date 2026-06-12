import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { createElement } from 'react'
import useInView from './useInView.js'

// A tiny probe that exposes the hook's state through a data attribute.
function Probe() {
  const [ref, inView] = useInView()
  return createElement('div', { ref, 'data-testid': 'probe', 'data-inview': String(inView) })
}

function renderProbe() {
  const { getByTestId } = render(createElement(Probe))
  return () => getByTestId('probe').getAttribute('data-inview')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useInView', () => {
  it('starts visible when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    expect(renderProbe()()).toBe('true')
  })

  it('starts visible and never observes under reduced motion', () => {
    const observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observe
        disconnect() {}
      },
    )
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })

    expect(renderProbe()()).toBe('true')
    expect(observe).not.toHaveBeenCalled()
  })

  it('starts hidden, then reveals once when the section scrolls into view', () => {
    const callbacks = []
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb) {
          callbacks.push(cb)
        }
        observe() {}
        disconnect = disconnect
      },
    )
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false })

    const readInView = renderProbe()
    expect(readInView()).toBe('false')

    act(() => callbacks[0]([{ isIntersecting: true }]))
    expect(readInView()).toBe('true')
    expect(disconnect).toHaveBeenCalledTimes(1) // fire-once
  })
})
