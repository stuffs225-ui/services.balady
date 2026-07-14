import { describe, expect, it, vi, afterEach } from 'vitest'
import { getEmployeePublicUrl } from './publicUrl'

describe('getEmployeePublicUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds the URL from VITE_APP_PUBLIC_URL and the token', () => {
    vi.stubEnv('VITE_APP_PUBLIC_URL', 'https://example-demo.vercel.app')
    expect(getEmployeePublicUrl('abc123')).toBe('https://example-demo.vercel.app/e/abc123')
  })

  it('strips a trailing slash from the base URL', () => {
    vi.stubEnv('VITE_APP_PUBLIC_URL', 'https://example-demo.vercel.app/')
    expect(getEmployeePublicUrl('abc123')).toBe('https://example-demo.vercel.app/e/abc123')
  })
})
