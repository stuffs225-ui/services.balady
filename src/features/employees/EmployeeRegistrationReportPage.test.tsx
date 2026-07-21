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

  it('numbers employees within a day starting at 1, in # / name / identity number / nationality column order', async () => {
    mockListEmployees.mockResolvedValue([
      makeEmployee({
        id: 'emp-1',
        employee_name: 'الموظف الأول',
        identity_number: '1111111111',
        nationality: 'جنسية أ',
        created_at: '2026-07-21T09:00:00Z',
      }),
      makeEmployee({
        id: 'emp-2',
        employee_name: 'الموظف الثاني',
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
      'الموظف الأول',
      '1111111111',
      'جنسية أ',
    ])

    const secondRowCells = within(rows[1]).getAllByRole('cell')
    expect(secondRowCells[0].textContent).toBe('2')

    expect(screen.getByText('العدد الإجمالي: 2')).toBeInTheDocument()
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
