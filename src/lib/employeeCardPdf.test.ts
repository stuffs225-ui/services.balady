import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { Employee, EmployeeCardLayout } from '../types/database'
import { defaultEmployeeCardLayout } from '../config/employeeCardLayout'

const mockRenderEmployeeCardToCanvas = vi.fn()
vi.mock('./employeeCardCanvas', () => ({
  renderEmployeeCardToCanvas: (...args: unknown[]) => mockRenderEmployeeCardToCanvas(...args),
}))

const mockAddImage = vi.fn()
const mockAddPage = vi.fn()
const mockOutput = vi.fn()
class FakeJsPdf {
  addImage = mockAddImage
  addPage = mockAddPage
  output = mockOutput
  save = vi.fn()
}
vi.mock('jspdf', () => ({
  jsPDF: FakeJsPdf,
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
  employee_photo_path: null,
  employee_photo_crop: null,
  employee_card_overrides: null,
  visit_count: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const LAYOUT: EmployeeCardLayout = defaultEmployeeCardLayout
const FAKE_BLOB = new Blob(['fake-pdf-bytes'], { type: 'application/pdf' })

describe('exportEmployeeCardPdfFast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRenderEmployeeCardToCanvas.mockResolvedValue({
      dataUrl: 'data:image/png;base64,fakebytes',
      warnings: [],
    })
    mockOutput.mockReturnValue(FAKE_BLOB)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders via the fast canvas pipeline (not the DOM/html-to-image path)', async () => {
    const { exportEmployeeCardPdfFast } = await import('./employeeCardPdf')
    vi.stubGlobal('navigator', { ...navigator, share: undefined, canShare: undefined })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })

    await exportEmployeeCardPdfFast({
      templateUrl: 'https://cdn.test/template.png',
      backTemplateUrl: null,
      employee: FAKE_EMPLOYEE,
      publicUrl: 'https://example.test/e/token-1',
      layout: LAYOUT,
    })

    expect(mockRenderEmployeeCardToCanvas).toHaveBeenCalledWith(
      'https://cdn.test/template.png',
      FAKE_EMPLOYEE,
      'https://example.test/e/token-1',
      LAYOUT,
      2,
    )
    clickSpy.mockRestore()
  })

  it('shares the PDF via navigator.share when the browser supports sharing files, instead of downloading a blob URL', async () => {
    const { exportEmployeeCardPdfFast } = await import('./employeeCardPdf')
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    const canShareSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, share: shareSpy, canShare: canShareSpy })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportEmployeeCardPdfFast({
      templateUrl: 'https://cdn.test/template.png',
      backTemplateUrl: null,
      employee: FAKE_EMPLOYEE,
      publicUrl: 'https://example.test/e/token-1',
      layout: LAYOUT,
    })

    expect(canShareSpy).toHaveBeenCalledWith({ files: [expect.any(File)] })
    expect(shareSpy).toHaveBeenCalledTimes(1)
    const sharedFile = shareSpy.mock.calls[0][0].files[0] as File
    expect(sharedFile.type).toBe('application/pdf')
    // Sharing succeeded — the anchor-download fallback must never run, since
    // that's exactly the blob-URL flow that opens an inline viewer page
    // instead of actually saving the file on iOS Safari.
    expect(clickSpy).not.toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('falls back to a direct blob-URL download when the browser cannot share files', async () => {
    const { exportEmployeeCardPdfFast } = await import('./employeeCardPdf')
    vi.stubGlobal('navigator', { ...navigator, share: undefined, canShare: undefined })
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportEmployeeCardPdfFast({
      templateUrl: 'https://cdn.test/template.png',
      backTemplateUrl: null,
      employee: FAKE_EMPLOYEE,
      publicUrl: 'https://example.test/e/token-1',
      layout: LAYOUT,
    })

    expect(createObjectURL).toHaveBeenCalledWith(FAKE_BLOB)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
    clickSpy.mockRestore()
  })

  it('does not call navigator.share when canShare reports the file cannot be shared', async () => {
    const { exportEmployeeCardPdfFast } = await import('./employeeCardPdf')
    const shareSpy = vi.fn()
    const canShareSpy = vi.fn().mockReturnValue(false)
    vi.stubGlobal('navigator', { ...navigator, share: shareSpy, canShare: canShareSpy })
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportEmployeeCardPdfFast({
      templateUrl: 'https://cdn.test/template.png',
      backTemplateUrl: null,
      employee: FAKE_EMPLOYEE,
      publicUrl: 'https://example.test/e/token-1',
      layout: LAYOUT,
    })

    expect(shareSpy).not.toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalledTimes(1)
    clickSpy.mockRestore()
  })
})
