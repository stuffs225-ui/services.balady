import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EmployeeDetailsPage from './EmployeeDetailsPage'
import type { Employee } from '../../types/database'

const mockGetEmployeeById = vi.fn()
const mockGetEmployeePhotoUrl = vi.fn()
const mockDeactivateEmployee = vi.fn()
const mockReactivateEmployee = vi.fn()
const mockDeleteEmployee = vi.fn()
const mockUpdateEmployeeUnpaidStatus = vi.fn()

vi.mock('./api', () => ({
  getEmployeeById: (...args: unknown[]) => mockGetEmployeeById(...args),
  getEmployeePhotoUrl: (...args: unknown[]) => mockGetEmployeePhotoUrl(...args),
  deactivateEmployee: (...args: unknown[]) => mockDeactivateEmployee(...args),
  reactivateEmployee: (...args: unknown[]) => mockReactivateEmployee(...args),
  deleteEmployee: (...args: unknown[]) => mockDeleteEmployee(...args),
  updateEmployeeUnpaidStatus: (...args: unknown[]) => mockUpdateEmployeeUnpaidStatus(...args),
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
  visit_count: 42,
  reactivated_at: null,
  is_unpaid: false,
  unpaid_note: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employees/emp-1']}>
      <Routes>
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="/employees" element={<p>قائمة الموظفين</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EmployeeDetailsPage permanent delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('deletes the employee and navigates back to the list when confirmed', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockDeleteEmployee.mockResolvedValue(undefined)

    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('button', { name: 'حذف نهائي' }))

    await waitFor(() => expect(mockDeleteEmployee).toHaveBeenCalledWith('emp-1', 'token-1/photo'))
    await waitFor(() => expect(screen.getByText('قائمة الموظفين')).toBeInTheDocument())

    vi.unstubAllGlobals()
  })

  it('does nothing if the confirmation dialog is declined', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))

    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('button', { name: 'حذف نهائي' }))

    expect(mockDeleteEmployee).not.toHaveBeenCalled()
    expect(screen.getByText('تفاصيل الموظف')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})

describe('EmployeeDetailsPage visit count', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('shows the admin-only visit count next to the action buttons', async () => {
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    expect(screen.getByText('عدد الزيارات: 42')).toBeInTheDocument()
  })
})

describe('EmployeeDetailsPage deactivate/reactivate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('shows only "إلغاء التفعيل" for an active employee, not "إعادة تفعيل"', async () => {
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    expect(screen.getByRole('button', { name: 'إلغاء التفعيل' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إعادة تفعيل' })).not.toBeInTheDocument()
  })

  it('shows only "إعادة تفعيل" for a deactivated employee, not "إلغاء التفعيل"', async () => {
    mockGetEmployeeById.mockResolvedValue({ ...FAKE_EMPLOYEE, is_active: false })
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    expect(screen.getByRole('button', { name: 'إعادة تفعيل' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إلغاء التفعيل' })).not.toBeInTheDocument()
  })

  it('reactivates the employee and swaps the button in place, without navigating away', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockGetEmployeeById.mockResolvedValue({ ...FAKE_EMPLOYEE, is_active: false })
    mockReactivateEmployee.mockResolvedValue(undefined)

    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('button', { name: 'إعادة تفعيل' }))

    await waitFor(() => expect(mockReactivateEmployee).toHaveBeenCalledWith('emp-1'))
    expect(await screen.findByRole('button', { name: 'إلغاء التفعيل' })).toBeInTheDocument()
    expect(screen.queryByText('قائمة الموظفين')).not.toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('shows an error message instead of failing silently when reactivation fails', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockGetEmployeeById.mockResolvedValue({ ...FAKE_EMPLOYEE, is_active: false })
    mockReactivateEmployee.mockRejectedValue(new Error('column "reactivated_at" does not exist'))

    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('button', { name: 'إعادة تفعيل' }))

    expect(await screen.findByText('تعذر إعادة تفعيل الموظف، يرجى المحاولة مرة أخرى')).toBeInTheDocument()
    // The button stays as "إعادة تفعيل" — the failed update never applied.
    expect(screen.getByRole('button', { name: 'إعادة تفعيل' })).toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('shows an error message instead of failing silently when deactivation fails', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    mockDeactivateEmployee.mockRejectedValue(new Error('boom'))

    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('button', { name: 'إلغاء التفعيل' }))

    expect(await screen.findByText('تعذر إلغاء تفعيل الموظف، يرجى المحاولة مرة أخرى')).toBeInTheDocument()
    expect(screen.queryByText('قائمة الموظفين')).not.toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})

describe('EmployeeDetailsPage payment status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('does not show the "لم يدفع" badge for an employee who has paid', async () => {
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    // Only the checkbox's own label says "لم يدفع" here — no separate badge.
    expect(screen.getAllByText('لم يدفع')).toHaveLength(1)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('shows the "لم يدفع" badge and pre-fills the note for an unpaid employee', async () => {
    mockGetEmployeeById.mockResolvedValue({
      ...FAKE_EMPLOYEE,
      is_unpaid: true,
      unpaid_note: 'دفعة متأخرة',
    })
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    // Both the badge and the checkbox's own label say "لم يدفع" once unpaid.
    expect(screen.getAllByText('لم يدفع')).toHaveLength(2)
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByDisplayValue('دفعة متأخرة')).toBeInTheDocument()
  })

  it('marks an employee as unpaid with a note and saves it', async () => {
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    mockUpdateEmployeeUnpaidStatus.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.type(screen.getByPlaceholderText('ملاحظة (اختياري)'), 'لم يدفع رسوم الشهادة')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ حالة الدفع' }))

    await waitFor(() =>
      expect(mockUpdateEmployeeUnpaidStatus).toHaveBeenCalledWith('emp-1', {
        isUnpaid: true,
        note: 'لم يدفع رسوم الشهادة',
      }),
    )
    expect(await screen.findByText('تم حفظ حالة الدفع')).toBeInTheDocument()
    expect(screen.getAllByText('لم يدفع')).toHaveLength(2)
  })

  it('clears the note when marking a previously-unpaid employee as paid', async () => {
    mockGetEmployeeById.mockResolvedValue({
      ...FAKE_EMPLOYEE,
      is_unpaid: true,
      unpaid_note: 'دفعة متأخرة',
    })
    mockUpdateEmployeeUnpaidStatus.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'حفظ حالة الدفع' }))

    await waitFor(() =>
      expect(mockUpdateEmployeeUnpaidStatus).toHaveBeenCalledWith('emp-1', {
        isUnpaid: false,
        note: null,
      }),
    )
    expect(screen.getAllByText('لم يدفع')).toHaveLength(1)
  })

  it('shows an error message if saving the payment status fails', async () => {
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    mockUpdateEmployeeUnpaidStatus.mockRejectedValue(new Error('boom'))
    renderPage()
    await screen.findByText('تفاصيل الموظف')

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'حفظ حالة الدفع' }))

    expect(await screen.findByText('تعذر حفظ حالة الدفع، يرجى المحاولة مرة أخرى')).toBeInTheDocument()
  })
})
