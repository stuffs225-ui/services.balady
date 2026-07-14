import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSiteSettings } from './useSiteSettings'
import { navLinks as defaultNavLinks, footerLinks as defaultFooterLinks } from '../../config/siteLinks'

const mockGetSiteSettings = vi.fn()
const mockGetBrandingAssetUrl = vi.fn((path: string | null) => (path ? `https://cdn.test/${path}` : null))

vi.mock('./api', () => ({
  getSiteSettings: () => mockGetSiteSettings(),
  getBrandingAssetUrl: (path: string | null) => mockGetBrandingAssetUrl(path),
}))

describe('useSiteSettings', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to static defaults when no settings row exists', async () => {
    mockGetSiteSettings.mockResolvedValue(null)
    const { result } = renderHook(() => useSiteSettings())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.navLinks).toEqual(defaultNavLinks)
    expect(result.current.footerLinks).toEqual(defaultFooterLinks)
    expect(result.current.logoUrl).toBeNull()
    expect(result.current.footerBadges).toEqual([])
  })

  it('falls back to static defaults when the query fails', async () => {
    mockGetSiteSettings.mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useSiteSettings())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.navLinks).toEqual(defaultNavLinks)
  })

  it('uses admin-configured values once they exist', async () => {
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      logo_path: 'logo/custom.svg',
      nav_links: [{ label: 'رئيسية', href: '/home' }],
      footer_links: [{ label: 'شروط', href: '/terms-custom' }],
      footer_badges: [{ imagePath: 'badges/one.png', alt: 'شارة', href: 'https://example.test' }],
      updated_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useSiteSettings())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.logoUrl).toBe('https://cdn.test/logo/custom.svg')
    expect(result.current.navLinks).toEqual([{ label: 'رئيسية', href: '/home' }])
    expect(result.current.footerLinks).toEqual([{ label: 'شروط', href: '/terms-custom' }])
    expect(result.current.footerBadges).toEqual([
      { imageUrl: 'https://cdn.test/badges/one.png', alt: 'شارة', href: 'https://example.test' },
    ])
  })
})
