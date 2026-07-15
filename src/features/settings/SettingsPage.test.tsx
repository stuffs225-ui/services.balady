import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import SettingsPage from './SettingsPage'

function renderSettingsPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  )
}

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
    renderSettingsPage()
    expect(await screen.findByDisplayValue('عن النظام')).toBeInTheDocument()
    expect(screen.getByDisplayValue('/about')).toBeInTheDocument()
  })

  it('adds a new empty nav link row', async () => {
    renderSettingsPage()
    await screen.findByDisplayValue('عن النظام')

    const before = screen.getAllByPlaceholderText('النص').length
    await userEvent.click(screen.getAllByRole('button', { name: 'إضافة رابط' })[0])

    expect(screen.getAllByPlaceholderText('النص')).toHaveLength(before + 1)
  })

  it('saves edited links and filters out empty rows', async () => {
    renderSettingsPage()
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getAllByRole('button', { name: 'إضافة رابط' })[0])
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    // The newly added empty row must be filtered out, not saved.
    expect(payload.nav_links).toEqual([{ label: 'عن النظام', href: '/about' }])
  })

  it('shows a success message after saving', async () => {
    renderSettingsPage()
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    expect(await screen.findByText('تم حفظ الإعدادات بنجاح')).toBeInTheDocument()
  })

  it('shows an error message when saving fails', async () => {
    mockUpdateSiteSettings.mockRejectedValue(new Error('boom'))
    renderSettingsPage()
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    expect(await screen.findByText('تعذر حفظ الإعدادات، يرجى المحاولة مرة أخرى')).toBeInTheDocument()
  })

  it('seeds the editor with the current on-screen nav/footer links when none are saved yet', async () => {
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      logo_path: null,
      nav_links: [],
      footer_links: [],
      footer_badges: [],
      updated_at: '2026-01-01T00:00:00Z',
    })

    renderSettingsPage()

    // The exact items currently shown in the mobile menu must be editable,
    // not a blank form the admin has to rebuild from scratch.
    expect(await screen.findByDisplayValue('عن النظام')).toBeInTheDocument()
    expect(screen.getByDisplayValue('الخدمات')).toBeInTheDocument()
    expect(screen.getByDisplayValue('الاستعلامات')).toBeInTheDocument()
    expect(screen.getByDisplayValue('تواصل معنا')).toBeInTheDocument()
    expect(screen.getByDisplayValue('/services')).toBeInTheDocument()
  })

  it('lets the admin change where an existing nav item points and saves it', async () => {
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      logo_path: null,
      nav_links: [],
      footer_links: [],
      footer_badges: [],
      updated_at: '2026-01-01T00:00:00Z',
    })

    renderSettingsPage()
    const servicesHrefInput = await screen.findByDisplayValue('/services')

    await userEvent.clear(servicesHrefInput)
    await userEvent.type(servicesHrefInput, '/our-services-page')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    expect(payload.nav_links).toEqual(
      expect.arrayContaining([{ label: 'الخدمات', href: '/our-services-page' }]),
    )
  })

  it('seeds footer copyright/support text with the current defaults', async () => {
    renderSettingsPage()
    expect(await screen.findByDisplayValue('جميع الحقوق محفوظة للجهة التجريبية © {year}')).toBeInTheDocument()
    expect(screen.getByDisplayValue('تم تطوير وتشغيل النسخة التجريبية لأغراض العرض')).toBeInTheDocument()
  })

  it('saves edited footer copyright/support text', async () => {
    renderSettingsPage()
    const copyrightInput = await screen.findByDisplayValue(
      'جميع الحقوق محفوظة للجهة التجريبية © {year}',
    )
    const supportInput = screen.getByDisplayValue('تم تطوير وتشغيل النسخة التجريبية لأغراض العرض')

    // user-event's type() treats "{" as the start of a special key
    // sequence, so set the literal value directly instead.
    fireEvent.change(copyrightInput, { target: { value: 'جميع الحقوق محفوظة لشركتي © {year}' } })
    fireEvent.change(supportInput, { target: { value: 'نص دعم مخصص' } })

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    expect(payload.footer_copyright_text).toBe('جميع الحقوق محفوظة لشركتي © {year}')
    expect(payload.footer_support_text).toBe('نص دعم مخصص')
  })

  it('loads and saves the logo link URL', async () => {
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      logo_path: null,
      logo_link_href: 'https://example.test/organization',
      nav_links: [],
      footer_links: [],
      footer_badges: [],
      updated_at: '2026-01-01T00:00:00Z',
    })

    renderSettingsPage()
    const logoLinkInput = await screen.findByDisplayValue('https://example.test/organization')

    fireEvent.change(logoLinkInput, { target: { value: 'https://example.test/new-page' } })
    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    expect(payload.logo_link_href).toBe('https://example.test/new-page')
  })

  it('converts a nav link into a dropdown with sections and sub-links, and saves it without needing an href on the item itself', async () => {
    renderSettingsPage()
    const label = await screen.findByDisplayValue('عن النظام')
    const navSection = label.closest('section')!

    // The "convert" button itself adds the first (empty) section.
    await userEvent.click(
      within(navSection).getByRole('button', {
        name: 'تحويل لقائمة منسدلة (تظهر عند الضغط بدل الانتقال لرابط)',
      }),
    )
    await userEvent.type(within(navSection).getByPlaceholderText('عنوان القسم'), 'الصفحات الشخصية')

    await userEvent.click(within(navSection).getByRole('button', { name: 'إضافة رابط للقسم' }))
    await userEvent.type(within(navSection).getByPlaceholderText('نص الرابط'), 'إدارة الطلبات')
    await userEvent.type(within(navSection).getByPlaceholderText('الرابط'), '/requests')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    expect(payload.nav_links).toEqual([
      {
        label: 'عن النظام',
        href: '/about',
        sections: [{ title: 'الصفحات الشخصية', links: [{ label: 'إدارة الطلبات', href: '/requests' }] }],
      },
    ])
  })

  it('drops empty sections and empty sub-links when saving a dropdown nav item', async () => {
    renderSettingsPage()
    const label = await screen.findByDisplayValue('عن النظام')
    const navSection = label.closest('section')!

    // The "convert" button adds the first (empty) section; one more click
    // adds a second, so exactly one of the two ends up filled in.
    await userEvent.click(
      within(navSection).getByRole('button', {
        name: 'تحويل لقائمة منسدلة (تظهر عند الضغط بدل الانتقال لرابط)',
      }),
    )
    await userEvent.click(within(navSection).getByRole('button', { name: 'إضافة قسم' }))
    const sectionTitleInputs = within(navSection).getAllByPlaceholderText('عنوان القسم')
    await userEvent.type(sectionTitleInputs[0], 'قسم فيه رابط')
    await userEvent.click(within(navSection).getAllByRole('button', { name: 'إضافة رابط للقسم' })[0])
    await userEvent.type(within(navSection).getAllByPlaceholderText('نص الرابط')[0], 'رابط تجريبي')
    await userEvent.type(within(navSection).getAllByPlaceholderText('الرابط')[0], '/example')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    expect(payload.nav_links).toEqual([
      {
        label: 'عن النظام',
        href: '/about',
        sections: [{ title: 'قسم فيه رابط', links: [{ label: 'رابط تجريبي', href: '/example' }] }],
      },
    ])
  })

  it('converts a dropdown nav item back to a plain link', async () => {
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      logo_path: null,
      nav_links: [
        {
          label: 'الخدمات',
          href: '',
          sections: [{ title: 'قسم', links: [{ label: 'رابط', href: '/x' }] }],
        },
      ],
      footer_links: [],
      footer_badges: [],
      updated_at: '2026-01-01T00:00:00Z',
    })

    renderSettingsPage()
    const label = await screen.findByDisplayValue('الخدمات')
    const navSection = label.closest('section')!
    expect(within(navSection).getByPlaceholderText('عنوان القسم')).toBeInTheDocument()

    await userEvent.click(within(navSection).getByRole('button', { name: 'تحويل لرابط مباشر' }))

    expect(within(navSection).queryByPlaceholderText('عنوان القسم')).not.toBeInTheDocument()
    expect(within(navSection).getByPlaceholderText('الرابط')).toBeInTheDocument()
  })

  it('saves a null logo link when left empty', async () => {
    renderSettingsPage()
    await screen.findByDisplayValue('عن النظام')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ الإعدادات' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0]
    expect(payload.logo_link_href).toBeNull()
  })
})
