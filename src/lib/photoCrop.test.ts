import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PHOTO_CROP,
  computeCoverDrawRect,
  normalizePhotoCrop,
} from './photoCrop'

describe('computeCoverDrawRect', () => {
  it('centers a square image in a square box with the default crop (no clipped slack)', () => {
    const rect = computeCoverDrawRect(200, 200, 100, 100, DEFAULT_PHOTO_CROP)
    expect(rect).toEqual({ x: 0, y: 0, width: 100, height: 100 })
  })

  it('covers a square box with a portrait image by matching width and overflowing height, centered', () => {
    // A portrait 200x400 image in a 100x100 box: cover-fit must scale to
    // the *larger* required ratio, max(100/200, 100/400) = 0.5, so the
    // drawn image is 100 wide (exactly fills) x 200 tall (overflows by
    // 100, centered by default so 50 is clipped off the top and bottom).
    const rect = computeCoverDrawRect(200, 400, 100, 100, DEFAULT_PHOTO_CROP)
    expect(rect.width).toBe(100)
    expect(rect.height).toBe(200)
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(-50)
  })

  it('pans fully to one edge when offset is 0 or 100', () => {
    // Landscape 400x200 image in a 100x100 box: cover-fit scales to width
    // (100/400 = 0.25) -> height becomes 50, but box needs 100, so it
    // actually scales to height instead: max(100/400, 100/200) = 0.5 ->
    // drawn 200x100, 100px of horizontal slack to pan across.
    const left = computeCoverDrawRect(400, 200, 100, 100, { scale: 1, offsetX: 0, offsetY: 50 })
    const right = computeCoverDrawRect(400, 200, 100, 100, { scale: 1, offsetX: 100, offsetY: 50 })
    expect(left.x).toBe(0)
    expect(right.x).toBe(-100)
  })

  it('extra zoom (scale > 1) increases the drawn size beyond the natural cover fit', () => {
    const natural = computeCoverDrawRect(200, 200, 100, 100, { scale: 1, offsetX: 50, offsetY: 50 })
    const zoomed = computeCoverDrawRect(200, 200, 100, 100, { scale: 2, offsetX: 50, offsetY: 50 })
    expect(zoomed.width).toBe(natural.width * 2)
    expect(zoomed.height).toBe(natural.height * 2)
  })
})

describe('normalizePhotoCrop', () => {
  it('passes through a valid crop unchanged', () => {
    expect(normalizePhotoCrop({ scale: 1.5, offsetX: 20, offsetY: 80 })).toEqual({
      scale: 1.5,
      offsetX: 20,
      offsetY: 80,
    })
  })

  it('falls back to the default for missing or malformed values', () => {
    expect(normalizePhotoCrop(null)).toEqual(DEFAULT_PHOTO_CROP)
    expect(normalizePhotoCrop(undefined)).toEqual(DEFAULT_PHOTO_CROP)
    expect(normalizePhotoCrop({})).toEqual(DEFAULT_PHOTO_CROP)
    expect(normalizePhotoCrop('not an object')).toEqual(DEFAULT_PHOTO_CROP)
  })

  it('clamps out-of-range values instead of trusting them', () => {
    expect(normalizePhotoCrop({ scale: 999, offsetX: -50, offsetY: 500 })).toEqual({
      scale: 4,
      offsetX: 0,
      offsetY: 100,
    })
  })
})
