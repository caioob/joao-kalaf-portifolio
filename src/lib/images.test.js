import { describe, it, expect } from 'vitest'
import { variantSrc, variantWidths, srcSetFor, SIZES, LADDERS } from './images.js'

describe('variantSrc', () => {
  it('inserts the width before the .webp extension', () => {
    expect(variantSrc('/images/projects/OVO-thumb.webp', 800)).toBe(
      '/images/projects/OVO-thumb-800.webp',
    )
  })
})

describe('variantWidths', () => {
  it('returns only ladder rungs below the intrinsic width', () => {
    expect(variantWidths('thumbnail', 1600)).toEqual([400, 800, 1200])
    expect(variantWidths('gallery', 1920)).toEqual([640, 1280])
  })

  it('returns [] when the intrinsic width is unknown or smaller than every rung', () => {
    expect(variantWidths('gallery', undefined)).toEqual([])
    expect(variantWidths('gallery', 500)).toEqual([])
  })
})

describe('srcSetFor', () => {
  it('lists sub-intrinsic variants plus the master at its own width', () => {
    expect(srcSetFor('/images/projects/x-thumb.webp', 'thumbnail', 1600)).toBe(
      '/images/projects/x-thumb-400.webp 400w, ' +
        '/images/projects/x-thumb-800.webp 800w, ' +
        '/images/projects/x-thumb-1200.webp 1200w, ' +
        '/images/projects/x-thumb.webp 1600w',
    )
  })

  it('emits only the master when it is smaller than every ladder rung', () => {
    expect(srcSetFor('/images/projects/x-1.webp', 'gallery', 500)).toBe(
      '/images/projects/x-1.webp 500w',
    )
  })

  it('returns an empty string when the intrinsic width is unknown', () => {
    expect(srcSetFor('/images/projects/x-1.webp', 'gallery', undefined)).toBe('')
  })
})

describe('config integrity', () => {
  it('defines a sizes string for every ladder slot', () => {
    for (const slot of Object.keys(LADDERS)) {
      expect(typeof SIZES[slot]).toBe('string')
    }
  })
})
