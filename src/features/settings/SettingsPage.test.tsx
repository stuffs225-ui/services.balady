import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from './SettingsPage'

const mockGetSiteSettings = vi.fn()
const mockUpdateSiteSettings = vi.fn()
const mockUploadBrandingAsset = vi.fn()
const mockGetBrandingAssetUrl = vi.fn((path: string | null) => (path ? `https://cdn.test/${path}` : null))

vi.mock('./api', () => ({
  getSiteSettings: () => mockGetSiteSettings(),
  updateSiteSettings: (update: unknown) => mockUpdateSiteSettings(update),
  uploadBrandingAsset: (file: File, folder: string) => mockUploadBrandingAsset(file, folder),
  getBrandingAssetUrl: (path: string | null) => mockGetBrandingAssetUrl(path),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      logo_path: null,
      nav_links: [{ label: 'عن النظام', href: '/about' }],
      footer_links: [],
      footer_badges: [],
      updated_at: '2026-01-01T00:00:00Z',
    })
    mockUpdateSiteSettings.mockResolvedValue({})
  })

  it('loads and displays existing nav links', async () => {
    render(<SettingsPage />)
    expect(await screen.findByDisplayValue('عن النظام')).toBeInTheDocument()
    expect(screen.getByDisplayValue('/about')).toBeInTheDocument()
  })

  it('adds a new empty nav link row', async () => {
    render(<SettingsPage />)
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getAllByRole('button', { name: 'إضافة رابط' })[0])

    const labelInputs = screen.getAllByPlaceholderText('النص')
    expect(labelInputs).toHaveLength(2)
  })

  it('saves edited links and filters out empty rows', async () => {
    render(<SettingsPage />)
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getAllByRole('button', { name: 'إضافة رابط' })[0])
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    // The newly added empty row must be filtered out, not saved.
    expect(payload.nav_links).toEqual([{ label: 'عن النظام', href: '/about' }])
  })

  it('shows a success message after saving', async () => {
    render(<SettingsPage />)
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    expect(await screen.findByText('تم حفظ الإعدادات بنجاح')).toBeInTheDocument()
  })

  it('shows an error message when saving fails', async () => {
    mockUpdateSiteSettings.mockRejectedValue(new Error('boom'))
    render(<SettingsPage />)
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    expect(await screen.findByText('تعذر حفظ الإعدادات، يرجى المحاولة مرة أخرى')).toBeInTheDocument()
  })
})
