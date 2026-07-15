import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import EmployeeListPage from './EmployeeListPage'
import type { Employee } from '../../types/database'

const mockListEmployees = vi.fn()
const mockDeactivateEmployee = vi.fn()
const mockDeleteEmployee = vi.fn()
const mockGetEmployeePhotoUrl = vi.fn()

vi.mock('./api', () => ({
  listEmployees: (...args: unknown[]) => mockListEmployees(...args),
  deactivateEmployee: (...args: unknown[]) => mockDeactivateEmployee(...args),
  deleteEmployee: (...args: unknown[]) => mockDeleteEmployee(...args),
  getEmployeePhotoUrl: (...args: unknown[]) => mockGetEmployeePhotoUrl(...args),
}))

vi.mock('../../lib/qrcode', () => ({
  generateQrDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
  downloadQrDataUrl: vi.fn(),
}))

const FAKE_EMPLOYEE: Employee = {
  id: 'emp-1',
  public_token: 'token-1',
  employee_name: 'موظف تجريبي',
  identity_number: '1234567890',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  profession: 'محاسب',
  authority_name: 'أمانة تجريبية',
  municipality_name: 'بلدية تجريبية',
  certificate_number: 'CERT-DEMO-0001',
  license_number: null,
  establishment_name: 'منشأة تجريبية',
  establishment_number: null,
  program_type: null,
  issue_date_hijri: null,
  issue_date_gregorian: '2026-06-30',
  expiry_date_hijri: null,
  expiry_date_gregorian: '2027-06-30',
  program_completion_date_hijri: null,
  employee_photo_path: 'token-1/photo',
  employee_photo_crop: null,
  employee_card_overrides: null,
  visit_count: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeeListPage />
    </MemoryRouter>,
  )
}

describe('EmployeeListPage permanent delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListEmployees.mockResolvedValue([FAKE_EMPLOYEE])
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('deletes the employee and removes them from the list when confirmed', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockDeleteEmployee.mockResolvedValue(undefined)

    renderPage()
    await screen.findByText('موظف تجريبي')

    await userEvent.click(screen.getByRole('button', { name: 'حذف نهائي' }))

    await waitFor(() => expect(mockDeleteEmployee).toHaveBeenCalledWith('emp-1', 'token-1/photo'))
    await waitFor(() => expect(screen.queryByText('موظف تجريبي')).not.toBeInTheDocument())

    vi.unstubAllGlobals()
  })

  it('does nothing if the confirmation dialog is declined', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))

    renderPage()
    await screen.findByText('موظف تجريبي')

    await userEvent.click(screen.getByRole('button', { name: 'حذف نهائي' }))

    expect(mockDeleteEmployee).not.toHaveBeenCalled()
    expect(screen.getByText('موظف تجريبي')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
