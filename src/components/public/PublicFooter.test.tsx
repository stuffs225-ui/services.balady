import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicFooter from './PublicFooter'
import { defaultFooterCopyrightText, defaultFooterSupportText } from '../../config/siteLinks'

const mockUseSiteSettings = vi.fn()
vi.mock('../../features/settings/useSiteSettings', () => ({
  useSiteSettings: () => mockUseSiteSettings(),
}))

describe('PublicFooter', () => {
  it('replaces {year} in the default copyright text with the current year', () => {
    mockUseSiteSettings.mockReturnValue({
      footerLinks: [],
      footerBadges: [],
      footerCopyrightText: defaultFooterCopyrightText,
      footerSupportText: defaultFooterSupportText,
    })

    render(<PublicFooter />)

    const year = new Date().getFullYear()
    expect(screen.getByText(`جميع الحقوق محفوظة للجهة التجريبية © ${year}`)).toBeInTheDocument()
    expect(screen.getByText(defaultFooterSupportText)).toBeInTheDocument()
  })

  it('renders an admin-edited copyright/support text as-is', () => {
    mockUseSiteSettings.mockReturnValue({
      footerLinks: [],
      footerBadges: [],
      footerCopyrightText: 'جميع الحقوق محفوظة لشركتي الخاصة',
      footerSupportText: 'دعم فني على مدار الساعة',
    })

    render(<PublicFooter />)

    expect(screen.getByText('جميع الحقوق محفوظة لشركتي الخاصة')).toBeInTheDocument()
    expect(screen.getByText('دعم فني على مدار الساعة')).toBeInTheDocument()
  })

  it('renders footer badges with and without a link', () => {
    mockUseSiteSettings.mockReturnValue({
      footerLinks: [],
      footerBadges: [
        { imageUrl: 'https://cdn.test/badge-linked.png', alt: 'شارة مرتبطة', href: 'https://example.test' },
        { imageUrl: 'https://cdn.test/badge-plain.png', alt: 'شارة بدون رابط', href: null },
      ],
      footerCopyrightText: defaultFooterCopyrightText,
      footerSupportText: defaultFooterSupportText,
    })

    render(<PublicFooter />)

    const linkedImage = screen.getByAltText('شارة مرتبطة')
    expect(linkedImage.closest('a')).toHaveAttribute('href', 'https://example.test')

    const plainImage = screen.getByAltText('شارة بدون رابط')
    expect(plainImage.closest('a')).toBeNull()
  })

  it('applies the admin-configured badge size to badge images and the footer logo mark', () => {
    mockUseSiteSettings.mockReturnValue({
      footerLinks: [],
      footerBadges: [
        { imageUrl: 'https://cdn.test/badge.png', alt: 'شارة', href: null },
      ],
      footerCopyrightText: defaultFooterCopyrightText,
      footerSupportText: defaultFooterSupportText,
      footerBadgeSize: 88,
    })

    render(<PublicFooter />)

    expect(screen.getByAltText('شارة')).toHaveStyle({ height: '88px' })
    const logoSvg = document.querySelector('svg[aria-label="شعار النظام التجريبي"]')
    expect(logoSvg).toHaveAttribute('width', '88')
  })

  it('follows content naturally (fixed margin-top, not pinned via mt-auto)', () => {
    mockUseSiteSettings.mockReturnValue({
      footerLinks: [],
      footerBadges: [],
      footerCopyrightText: defaultFooterCopyrightText,
      footerSupportText: defaultFooterSupportText,
    })

    const { container } = render(<PublicFooter />)
    const footer = container.querySelector('footer')!
    expect(footer.className).toContain('mt-[48px]')
    expect(footer.className).not.toContain('mt-auto')
  })
})
