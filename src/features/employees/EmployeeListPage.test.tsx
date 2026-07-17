import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import EmployeeListPage from './EmployeeListPage'
import type { Employee } from '../../types/database'

const mockListEmployees = vi.fn()
const mockDeactivateEmployee = vi.fn()
const mockReactivateEmployee = vi.fn()
const mockDeleteEmployee = vi.fn()
const mockGetEmployeePhotoUrl = vi.fn()
const mockGetEmployeeStats = vi.fn()

vi.mock('./api', () => ({
  listEmployees: (...args: unknown[]) => mockListEmployees(...args),
  deactivateEmployee: (...args: unknown[]) => mockDeactivateEmployee(...args),
  reactivateEmployee: (...args: unknown[]) => mockReactivateEmployee(...args),
  deleteEmployee: (...args: unknown[]) => mockDeleteEmployee(...args),
  getEmployeePhotoUrl: (...args: unknown[]) => mockGetEmployeePhotoUrl(...args),
  getEmployeeStats: (...args: unknown[]) => mockGetEmployeeStats(...args),
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
    mockGetEmployeeStats.mockResolvedValue({
      totalEmployees: 1,
      totalVisits: 0,
      averageVisitsLast3Days: 0,
    })
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

describe('EmployeeListPage stats summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListEmployees.mockResolvedValue([FAKE_EMPLOYEE])
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('shows the total employee count, total visits, and average visits over the last 3 days', async () => {
    mockGetEmployeeStats.mockResolvedValue({
      totalEmployees: 12,
      totalVisits: 340,
      averageVisitsLast3Days: 4.5,
    })

    renderPage()

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('340')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('does not show the stats summary while it has not loaded yet, and the rest of the page still works', async () => {
    mockGetEmployeeStats.mockReturnValue(new Promise(() => {}))

    renderPage()

    await screen.findByText('موظف تجريبي')
    expect(screen.queryByText('إجمالي عدد الموظفين')).not.toBeInTheDocument()
  })

  it('refreshes the stats after a permanent delete', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockDeleteEmployee.mockResolvedValue(undefined)
    mockGetEmployeeStats
      .mockResolvedValueOnce({ totalEmployees: 1, totalVisits: 5, averageVisitsLast3Days: 1 })
      .mockResolvedValueOnce({ totalEmployees: 0, totalVisits: 0, averageVisitsLast3Days: 0 })

    renderPage()
    await screen.findByText('موظف تجريبي')
    expect(await screen.findByText('1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'حذف نهائي' }))

    await waitFor(() => expect(mockGetEmployeeStats).toHaveBeenCalledTimes(2))
    vi.unstubAllGlobals()
  })
})

describe('EmployeeListPage deactivate/reactivate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
    mockGetEmployeeStats.mockResolvedValue({
      totalEmployees: 1,
      totalVisits: 0,
      averageVisitsLast3Days: 0,
    })
  })

  it('shows only "إلغاء التفعيل" for an active employee', async () => {
    mockListEmployees.mockResolvedValue([FAKE_EMPLOYEE])
    renderPage()
    await screen.findByText('موظف تجريبي')

    expect(screen.getByRole('button', { name: 'إلغاء التفعيل' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إعادة تفعيل' })).not.toBeInTheDocument()
  })

  it('shows only "إعادة تفعيل" for a deactivated employee, and reactivates them on click', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockListEmployees.mockResolvedValue([{ ...FAKE_EMPLOYEE, is_active: false }])
    mockReactivateEmployee.mockResolvedValue(undefined)

    renderPage()
    await screen.findByText('موظف تجريبي')

    expect(screen.queryByRole('button', { name: 'إلغاء التفعيل' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'إعادة تفعيل' }))

    await waitFor(() => expect(mockReactivateEmployee).toHaveBeenCalledWith('emp-1'))
    expect(await screen.findByRole('button', { name: 'إلغاء التفعيل' })).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
