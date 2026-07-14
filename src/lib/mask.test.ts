import { describe, expect, it } from 'vitest'
import { maskIdentityNumber } from './mask'

describe('maskIdentityNumber', () => {
  it('masks all but the last 3 digits', () => {
    expect(maskIdentityNumber('2547109609')).toBe('*******609')
  })

  it('handles short values by masking everything', () => {
    expect(maskIdentityNumber('12')).toBe('**')
  })

  it('returns an empty string for null/undefined', () => {
    expect(maskIdentityNumber(null)).toBe('')
    expect(maskIdentityNumber(undefined)).toBe('')
  })

  it('never leaks more than the last 3 characters', () => {
    const masked = maskIdentityNumber('9998887776')
    expect(masked.slice(0, -3)).toMatch(/^\*+$/)
    expect(masked.slice(-3)).toBe('776')
  })
})
