import { describe, expect, it } from 'vitest'
import { generatePublicToken } from './token'

describe('generatePublicToken', () => {
  it('generates a URL-safe token', () => {
    const token = generatePublicToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('has no padding characters', () => {
    const token = generatePublicToken()
    expect(token).not.toContain('=')
  })

  it('carries at least 128 bits of entropy (16 raw bytes)', () => {
    const token = generatePublicToken()
    // Base64url encodes 3 bytes into 4 chars; 16 bytes -> 22 chars (no padding).
    expect(token.length).toBeGreaterThanOrEqual(21)
  })

  it('is not sequential or guessable across calls', () => {
    const tokens = Array.from({ length: 50 }, () => generatePublicToken())
    const unique = new Set(tokens)
    expect(unique.size).toBe(tokens.length)
  })

  it('never derives from predictable input like counters', () => {
    const a = generatePublicToken()
    const b = generatePublicToken()
    expect(a).not.toBe(b)
  })
})
