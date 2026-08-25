import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { Employee } from '../types/database'

// The SUT is imported dynamically inside each test (not statically here) —
// it imports 'jspdf' at module load time, and a static top-level import
// would run before the FakeJsPdf class below is declared, hitting a
// temporal-dead-zone error when the mocked 'jspdf' factory tries to
// reference it.

const mockGetEmployeePhotoUrl = vi.fn()
vi.mock('../features/employees/api', () => ({
  getEmployeePhotoUrl: (...args: unknown[]) => mockGetEmployeePhotoUrl(...args),
}))

const mockLoadImageViaBlob = vi.fn()
vi.mock('./employeeCardCanvas', () => ({
  loadImageViaBlob: (...args: unknown[]) => mockLoadImageViaBlob(...args),
}))

const mockSavePdfDirectly = vi.fn()
vi.mock('./employeeCardPdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./employeeCardPdf')>()
  return { ...actual, savePdfDirectly: (...args: unknown[]) => mockSavePdfDirectly(...args) }
})

const mockAddImage = vi.fn()
const mockAddPage = vi.fn()
class FakeJsPdf {
  internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } }
  addImage = mockAddImage
  addPage = mockAddPage
}
vi.mock('jspdf', () => ({ jsPDF: FakeJsPdf }))

/** A minimal stand-in 2D context — enough for the module's drawing calls to run without a real canvas. */
function makeFakeContext(): Partial<CanvasRenderingContext2D> {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 } as TextMetrics),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  }
}

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
    is_unpaid: true,
    unpaid_note: 'لم يدفع منذ شهر',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('exportUnpaidEmployeesReportPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeePhotoUrl.mockResolvedValue(null)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      makeFakeContext() as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,fake')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a single PDF page when every row fits within ROWS_PER_PAGE', async () => {
    const { exportUnpaidEmployeesReportPdf } = await import('./unpaidEmployeesReportPdf')
    const employees = [makeEmployee({ id: 'emp-1' }), makeEmployee({ id: 'emp-2' })]

    const { warnings } = await exportUnpaidEmployeesReportPdf(employees)

    expect(warnings).toEqual([])
    expect(mockAddImage).toHaveBeenCalledTimes(1)
    expect(mockAddPage).not.toHaveBeenCalled()
    expect(mockSavePdfDirectly).toHaveBeenCalledTimes(1)
    expect(mockSavePdfDirectly.mock.calls[0][1]).toContain('تقرير الموظفين غير المدفوعين')
  })

  it('starts a new PDF page once the row count exceeds ROWS_PER_PAGE', async () => {
    const { exportUnpaidEmployeesReportPdf, ROWS_PER_PAGE } = await import('./unpaidEmployeesReportPdf')
    const employees = Array.from({ length: ROWS_PER_PAGE + 1 }, (_, i) =>
      makeEmployee({ id: `emp-${i}` }),
    )

    await exportUnpaidEmployeesReportPdf(employees)

    expect(mockAddImage).toHaveBeenCalledTimes(2)
    expect(mockAddPage).toHaveBeenCalledTimes(1)
  })

  it('does not attempt to load a photo for an employee with none', async () => {
    const { exportUnpaidEmployeesReportPdf } = await import('./unpaidEmployeesReportPdf')
    const employees = [makeEmployee({ id: 'emp-1', employee_photo_path: null })]

    const { warnings } = await exportUnpaidEmployeesReportPdf(employees)

    expect(mockGetEmployeePhotoUrl).not.toHaveBeenCalled()
    expect(mockLoadImageViaBlob).not.toHaveBeenCalled()
    expect(warnings).toEqual([])
  })

  it('collects a warning (but still completes the export) when a photo fails to load', async () => {
    const { exportUnpaidEmployeesReportPdf } = await import('./unpaidEmployeesReportPdf')
    mockGetEmployeePhotoUrl.mockResolvedValue('https://cdn.test/photo.jpg')
    mockLoadImageViaBlob.mockResolvedValue(null)
    const employees = [
      makeEmployee({ id: 'emp-1', employee_name: 'موظف بدون صورة', employee_photo_path: 'token/photo' }),
    ]

    const { warnings } = await exportUnpaidEmployeesReportPdf(employees)

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('موظف بدون صورة')
    expect(mockSavePdfDirectly).toHaveBeenCalledTimes(1)
  })
})
