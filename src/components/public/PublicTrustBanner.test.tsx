import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicTrustBanner from './PublicTrustBanner'
import { siteIdentity } from '../../config/siteLinks'

const mockUseSiteSettings = vi.fn()
vi.mock('../../features/settings/useSiteSettings', () => ({
  useSiteSettings: () => mockUseSiteSettings(),
}))

describe('PublicTrustBanner', () => {
  it('shows the default demo disclaimer when no admin text is set', () => {
    mockUseSiteSettings.mockReturnValue({ trustBannerText: siteIdentity.demoDisclaimer })
    render(<PublicTrustBanner />)
    expect(screen.getByText('نسخة تجريبية غير تابعة لأي جهة حكومية')).toBeInTheDocument()
  })

  it('shows an admin-edited disclaimer sentence', () => {
    mockUseSiteSettings.mockReturnValue({ trustBannerText: 'جملة تعريفية مخصصة من الإدارة' })
    render(<PublicTrustBanner />)
    expect(screen.getByText('جملة تعريفية مخصصة من الإدارة')).toBeInTheDocument()
  })

  it('no longer shows a "كيف تتحقق" control', () => {
    mockUseSiteSettings.mockReturnValue({ trustBannerText: siteIdentity.demoDisclaimer })
    render(<PublicTrustBanner />)
    expect(screen.queryByText('كيف تتحقق')).not.toBeInTheDocument()
  })
})
