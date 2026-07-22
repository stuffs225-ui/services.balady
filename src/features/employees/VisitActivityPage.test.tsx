import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VisitActivityPage from './VisitActivityPage'
import type { EmployeeVisitSummary } from './api'

const mockListVisitEventsSince = vi.fn()
const mockGetEmployeeVisitSummaries = vi.fn()
const mockGetSiteSettings = vi.fn()

vi.mock('./api', () => ({
  listVisitEventsSince: (...args: unknown[]) => mockListVisitEventsSince(...args),
  getEmployeeVisitSummaries: (...args: unknown[]) => mockGetEmployeeVisitSummaries(...args),
}))

vi.mock('../settings/api', () => ({
  getSiteSettings: (...args: unknown[]) => mockGetSiteSettings(...args),
}))

function makeSummary(overrides: Partial<EmployeeVisitSummary>): EmployeeVisitSummary {
  return {
    id: 'emp-id',
    employee_name: 'اسم تجريبي',
    identity_number: '1000000000',
    nationality: 'الجنسية التجريبية',
    profession: 'مهنة تجريبية',
    certificate_number: 'CERT-DEMO-0000',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <VisitActivityPage />
    </MemoryRouter>,
  )
}

describe('VisitActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSiteSettings.mockResolvedValue(null)
  })

  it('shows the empty state for both sections when there are no visits today', async () => {
    mockListVisitEventsSince.mockResolvedValue([])
    mockGetEmployeeVisitSummaries.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('لا توجد زيارات مسجّلة اليوم بعد')).toBeInTheDocument()
    expect(screen.getByText('لا توجد تنبيهات — نشاط الزيارات اليوم طبيعي')).toBeInTheDocument()
  })

  it('ranks the leaderboard by visit count, most-visited first', async () => {
    mockListVisitEventsSince.mockResolvedValue([
      { id: '1', employee_id: 'emp-quiet', visited_at: '2026-07-22T09:00:00Z' },
      { id: '2', employee_id: 'emp-busy', visited_at: '2026-07-22T09:00:00Z' },
      { id: '3', employee_id: 'emp-busy', visited_at: '2026-07-22T09:05:00Z' },
    ])
    mockGetEmployeeVisitSummaries.mockResolvedValue([
      makeSummary({ id: 'emp-quiet', employee_name: 'موظف هادئ' }),
      makeSummary({ id: 'emp-busy', employee_name: 'موظف نشيط' }),
    ])

    renderPage()

    const busyRow = (await screen.findByText('موظف نشيط')).closest('div')!.parentElement!
    expect(within(busyRow).getByText('2 زيارات')).toBeInTheDocument()

    const quietRow = screen.getByText('موظف هادئ').closest('div')!.parentElement!
    expect(within(quietRow).getByText('1 زيارة')).toBeInTheDocument()
  })

  it('shows an alert row with the employee, reason, and detail for a rapid-scan burst, using the default thresholds', async () => {
    const base = new Date('2026-07-22T10:00:00.000Z').getTime()
    mockListVisitEventsSince.mockResolvedValue(
      [0, 1, 2, 3].map((i) => ({
        id: String(i),
        employee_id: 'emp-1',
        visited_at: new Date(base + i * 60_000).toISOString(),
      })),
    )
    mockGetEmployeeVisitSummaries.mockResolvedValue([
      makeSummary({ id: 'emp-1', employee_name: 'موظف مشبوه', identity_number: '9999999999' }),
    ])

    renderPage()

    const table = within(await screen.findByRole('table'))
    expect(table.getByText('موظف مشبوه')).toBeInTheDocument()
    expect(table.getByText('9999999999')).toBeInTheDocument()
    expect(table.getByText('مسح متكرر خلال وقت قصير')).toBeInTheDocument()
    expect(table.getByText('4 مسحات خلال 15 دقيقة')).toBeInTheDocument()
  })

  it('shows an alert row for an employee with more than 5 visits today', async () => {
    const events = []
    for (let i = 0; i < 6; i++) {
      events.push({ id: String(i), employee_id: 'emp-1', visited_at: `2026-07-22T0${i}:00:00Z` })
    }
    mockListVisitEventsSince.mockResolvedValue(events)
    mockGetEmployeeVisitSummaries.mockResolvedValue([
      makeSummary({ id: 'emp-1', employee_name: 'موظف كثير الزيارات' }),
    ])

    renderPage()

    expect(await screen.findByText('عدد زيارات مرتفع اليوم')).toBeInTheDocument()
    expect(screen.getByText('6 زيارات اليوم')).toBeInTheDocument()
  })

  it('uses the admin-configured thresholds from site settings instead of the defaults', async () => {
    const baseMs = new Date('2026-07-22T10:00:00.000Z').getTime()
    mockListVisitEventsSince.mockResolvedValue(
      [0, 1].map((i) => ({
        id: String(i),
        employee_id: 'emp-1',
        visited_at: new Date(baseMs + i * 60_000).toISOString(),
      })),
    )
    mockGetEmployeeVisitSummaries.mockResolvedValue([
      makeSummary({ id: 'emp-1', employee_name: 'موظف' }),
    ])
    mockGetSiteSettings.mockResolvedValue({
      visit_alert_rapid_threshold: 1,
      visit_alert_rapid_window_minutes: 5,
      visit_alert_daily_threshold: 10,
    })

    renderPage()

    expect(await screen.findByText('2 مسحات خلال 5 دقيقة')).toBeInTheDocument()
    expect(
      screen.getByText('أكثر من 1 مسحات خلال 5 دقيقة، أو أكثر من 10 مسحات في اليوم', { exact: false }),
    ).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    mockListVisitEventsSince.mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByText('تعذر تحميل نشاط الزيارات، يرجى تحديث الصفحة')).toBeInTheDocument()
  })
})
