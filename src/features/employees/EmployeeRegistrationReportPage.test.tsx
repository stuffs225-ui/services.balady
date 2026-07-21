import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EmployeeRegistrationReportPage from './EmployeeRegistrationReportPage'
import type { Employee } from '../../types/database'

const mockListEmployees = vi.fn()
vi.mock('./api', () => ({
  listEmployees: (...args: unknown[]) => mockListEmployees(...args),
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
    is_active: true,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeeRegistrationReportPage />
    </MemoryRouter>,
  )
}

describe('EmployeeRegistrationReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('groups employees by registration day, most recent day first, with the count and each field in the requested order', async () => {
    mockListEmployees.mockResolvedValue([
      // listEmployees() already returns newest-first.
      makeEmployee({
        id: 'emp-2',
        employee_name: 'موظف يوم ثاني',
        identity_number: '2000000000',
        nationality: 'جنسية ب',
        created_at: '2026-07-21T12:00:00Z',
      }),
      makeEmployee({
        id: 'emp-1',
        employee_name: 'موظف يوم أول',
        identity_number: '1000000000',
        nationality: 'جنسية أ',
        created_at: '2026-07-20T12:00:00Z',
      }),
    ])

    renderPage()

    expect(await screen.findByText('موظف يوم ثاني')).toBeInTheDocument()

    const totals = screen.getAllByText(/العدد الإجمالي: 1/)
    expect(totals).toHaveLength(2)

    const sections = screen.getAllByRole('table')
    expect(sections).toHaveLength(2)

    // Most recent day appears first.
    const firstSection = within(sections[0])
    expect(firstSection.getByText('موظف يوم ثاني')).toBeInTheDocument()
    expect(firstSection.getByText('2000000000')).toBeInTheDocument()
    expect(firstSection.getByText('جنسية ب')).toBeInTheDocument()

    const secondSection = within(sections[1])
    expect(secondSection.getByText('موظف يوم أول')).toBeInTheDocument()
  })

  it('numbers employees within a day starting at 1 with the most recently registered first, in # / name / identity number / nationality column order', async () => {
    mockListEmployees.mockResolvedValue([
      makeEmployee({
        id: 'emp-1',
        employee_name: 'الموظف الأبكر',
        identity_number: '1111111111',
        nationality: 'جنسية أ',
        created_at: '2026-07-21T09:00:00Z',
      }),
      makeEmployee({
        id: 'emp-2',
        employee_name: 'الموظف الأحدث',
        identity_number: '2222222222',
        nationality: 'جنسية ب',
        created_at: '2026-07-21T15:00:00Z',
      }),
    ])

    renderPage()

    const table = await screen.findByRole('table')
    const headerCells = within(table).getAllByRole('columnheader')
    expect(headerCells.map((cell) => cell.textContent)).toEqual(['#', 'الاسم', 'رقم الهوية', 'الجنسية'])

    const rows = within(table).getAllByRole('row').slice(1) // skip header row
    const firstRowCells = within(rows[0]).getAllByRole('cell')
    expect(firstRowCells.map((cell) => cell.textContent)).toEqual([
      '1',
      'الموظف الأحدث',
      '2222222222',
      'جنسية ب',
    ])

    const secondRowCells = within(rows[1]).getAllByRole('cell')
    expect(secondRowCells.map((cell) => cell.textContent)).toEqual([
      '2',
      'الموظف الأبكر',
      '1111111111',
      'جنسية أ',
    ])

    expect(screen.getByText('العدد الإجمالي: 2')).toBeInTheDocument()
  })

  it('groups a reactivated employee under their reactivation day, not their original signup day', async () => {
    mockListEmployees.mockResolvedValue([
      makeEmployee({
        id: 'emp-reactivated',
        employee_name: 'موظف أعيد تفعيله',
        identity_number: '3333333333',
        nationality: 'جنسية ج',
        created_at: '2026-01-01T12:00:00Z', // original signup, long before reactivation
        reactivated_at: '2026-07-21T12:00:00Z',
      }),
      makeEmployee({
        id: 'emp-old',
        employee_name: 'موظف قديم غير معاد تفعيله',
        identity_number: '4444444444',
        created_at: '2026-01-01T12:00:00Z',
        reactivated_at: null,
      }),
    ])

    renderPage()

    // The reactivated employee shows up under 2026-07-21 (the reactivation
    // date), in its own day group, separate from the other employee who
    // still shows up under their original 2026-01-01 signup date.
    const reactivatedHeading = await screen.findByText('موظف أعيد تفعيله')
    const reactivatedSection = reactivatedHeading.closest('section')!
    expect(within(reactivatedSection).getByText('العدد الإجمالي: 1')).toBeInTheDocument()
    expect(within(reactivatedSection).queryByText('موظف قديم غير معاد تفعيله')).not.toBeInTheDocument()

    const oldEmployeeHeading = screen.getByText('موظف قديم غير معاد تفعيله')
    const oldSection = oldEmployeeHeading.closest('section')!
    expect(oldSection).not.toBe(reactivatedSection)
  })

  it('shows a message when there are no registered employees yet', async () => {
    mockListEmployees.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('لا يوجد موظفون مسجّلون بعد')).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    mockListEmployees.mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByText('تعذر تحميل التقرير، يرجى تحديث الصفحة')).toBeInTheDocument()
  })
})
