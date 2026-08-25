import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import UnpaidEmployeesReportPage from './UnpaidEmployeesReportPage'
import type { Employee } from '../../types/database'

const mockListEmployees = vi.fn()
const mockGetEmployeePhotoUrl = vi.fn()
vi.mock('./api', () => ({
  listEmployees: (...args: unknown[]) => mockListEmployees(...args),
  getEmployeePhotoUrl: (...args: unknown[]) => mockGetEmployeePhotoUrl(...args),
}))

const mockExportUnpaidEmployeesReportPdf = vi.fn()
vi.mock('../../lib/unpaidEmployeesReportPdf', () => ({
  exportUnpaidEmployeesReportPdf: (...args: unknown[]) => mockExportUnpaidEmployeesReportPdf(...args),
}))

function makeEmployee(overrides: Partial<Employee>): Employee {
  return {
    id: 'emp-id',
    public_token: 'token',
    employee_name: 'اسم تجريبي',
    identity_number: '1000000000',
    gender: 'ذكر',
    nationality: 'الجنسية التجريبية',
    profession: 'مهنة تجريبية',
    authority_name: 'أمانة تجريبية',
    municipality_name: 'بلدية تجريبية',
    certificate_number: 'CERT-DEMO-0000',
    license_number: null,
    establishment_name: 'منشأة تجريبية',
    establishment_number: null,
    program_type: null,
    issue_date_hijri: null,
    issue_date_gregorian: '2026-06-30',
    expiry_date_hijri: null,
    expiry_date_gregorian: '2027-06-30',
    program_completion_date_hijri: null,
    employee_photo_path: null,
    employee_photo_crop: null,
    employee_card_overrides: null,
    visit_count: 0,
    reactivated_at: null,
    is_unpaid: false,
    unpaid_note: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <UnpaidEmployeesReportPage />
    </MemoryRouter>,
  )
}

describe('UnpaidEmployeesReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
  })

  it('shows a message when there are no unpaid employees', async () => {
    mockListEmployees.mockResolvedValue([
      makeEmployee({ id: 'emp-1', employee_name: 'موظف مدفوع', is_unpaid: false }),
    ])

    renderPage()

    expect(await screen.findByText('لا يوجد موظفون غير مدفوعين حاليًا')).toBeInTheDocument()
    expect(screen.queryByText('موظف مدفوع')).not.toBeInTheDocument()
  })

  it('lists only the unpaid employees, with the requested column order and note', async () => {
    mockListEmployees.mockResolvedValue([
      makeEmployee({ id: 'emp-paid', employee_name: 'موظف مدفوع', is_unpaid: false }),
      makeEmployee({
        id: 'emp-unpaid',
        employee_name: 'موظف غير مدفوع',
        identity_number: '2222222222',
        nationality: 'جنسية ب',
        is_unpaid: true,
        unpaid_note: 'لم يدفع رسوم الشهادة',
      }),
    ])

    renderPage()

    expect(await screen.findByText('موظف غير مدفوع')).toBeInTheDocument()
    expect(screen.queryByText('موظف مدفوع')).not.toBeInTheDocument()

    const table = within(screen.getByRole('table'))
    const headerCells = table.getAllByRole('columnheader')
    expect(headerCells.map((cell) => cell.textContent)).toEqual([
      '#',
      'الاسم',
      'رقم الهوية',
      'الجنسية',
      'تاريخ التسجيل',
      'الصورة',
      'الملاحظة',
    ])

    expect(table.getByText('2222222222')).toBeInTheDocument()
    expect(table.getByText('جنسية ب')).toBeInTheDocument()
    expect(table.getByText('لم يدفع رسوم الشهادة')).toBeInTheDocument()
    expect(screen.getByText('العدد الإجمالي').nextElementSibling).toHaveTextContent('1')
  })

  it('downloads the PDF report when the button is clicked', async () => {
    mockListEmployees.mockResolvedValue([makeEmployee({ id: 'emp-1', is_unpaid: true })])
    mockExportUnpaidEmployeesReportPdf.mockResolvedValue({ warnings: [] })

    renderPage()
    await screen.findByText('اسم تجريبي')

    await userEvent.click(screen.getByRole('button', { name: 'تحميل تقرير PDF' }))

    expect(mockExportUnpaidEmployeesReportPdf).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'emp-1' }),
    ])
  })

  it('shows an error message if the PDF export fails', async () => {
    mockListEmployees.mockResolvedValue([makeEmployee({ id: 'emp-1', is_unpaid: true })])
    mockExportUnpaidEmployeesReportPdf.mockRejectedValue(new Error('تعذر إنشاء لوحة الرسم'))

    renderPage()
    await screen.findByText('اسم تجريبي')

    await userEvent.click(screen.getByRole('button', { name: 'تحميل تقرير PDF' }))

    expect(await screen.findByText(/تعذر إنشاء ملف PDF/)).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    mockListEmployees.mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByText('تعذر تحميل التقرير، يرجى تحديث الصفحة')).toBeInTheDocument()
  })
})
