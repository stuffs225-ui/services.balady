import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EmployeeFormStylePage from './EmployeeFormStylePage'

const mockGetSiteSettings = vi.fn()
const mockUpdateSiteSettings = vi.fn()

vi.mock('./api', () => ({
  getSiteSettings: () => mockGetSiteSettings(),
  updateSiteSettings: (update: unknown) => mockUpdateSiteSettings(update),
  getEmployeeCardTemplateUrl: () => null,
  getBrandingAssetUrl: () => null,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeeFormStylePage />
    </MemoryRouter>,
  )
}

describe('EmployeeFormStylePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSiteSettings.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      employee_form_field_styles: null,
      updated_at: '2026-01-01T00:00:00Z',
    })
    mockUpdateSiteSettings.mockResolvedValue({})
  })

  it('shows the field list and the live preview once loaded', async () => {
    renderPage()
    expect(await screen.findAllByText('الأمانة')).not.toHaveLength(0)
    // The preview form renders the same field, so the label appears twice.
    expect(screen.getAllByText('الأمانة').length).toBeGreaterThanOrEqual(2)
  })

  it('switches a field to LTR/left and saves the updated style map', async () => {
    renderPage()
    await screen.findAllByText('الأمانة')

    const authorityCard = screen.getAllByText('الأمانة')[0].closest('div')!
    await userEvent.click(within(authorityCard).getByRole('button', { name: 'يسار لليمين (LTR)' }))
    await userEvent.click(within(authorityCard).getByRole('button', { name: 'يسار' }))

    await userEvent.click(screen.getByRole('button', { name: 'حفظ إعدادات الفورم' }))

    await waitFor(() => expect(mockUpdateSiteSettings).toHaveBeenCalledTimes(1))
    const payload = mockUpdateSiteSettings.mock.calls[0][0] as {
      employee_form_field_styles: Record<string, { dir: string; align: string }>
    }
    expect(payload.employee_form_field_styles.authorityName).toEqual({ dir: 'ltr', align: 'left' })
  })

  it('shows a success message after saving', async () => {
    renderPage()
    await screen.findAllByText('الأمانة')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ إعدادات الفورم' }))

    expect(await screen.findByText('تم حفظ إعدادات الفورم بنجاح')).toBeInTheDocument()
  })
})
