import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrintEmployeePage from './PrintEmployeePage'
import type { Employee } from '../../types/database'
import { defaultEmployeeCardLayout } from '../../config/employeeCardLayout'

const mockGetEmployeeById = vi.fn()
vi.mock('./api', () => ({
  getEmployeeById: (...args: unknown[]) => mockGetEmployeeById(...args),
  getEmployeePhotoUrl: vi.fn().mockResolvedValue(null),
}))

const mockUseSiteSettings = vi.fn()
vi.mock('../settings/useSiteSettings', () => ({
  useSiteSettings: () => mockUseSiteSettings(),
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
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

/** A controllable stand-in for the browser's Image constructor — lets a
 * test decide exactly when the "network load" resolves. */
class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ''
  get src() {
    return this._src
  }
  set src(value: string) {
    this._src = value
    FakeImage.pending.push(this)
  }
  static pending: FakeImage[] = []
  static resolveAll() {
    const images = FakeImage.pending.splice(0)
    images.forEach((img) => img.onload?.())
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employees/emp-1/print']}>
      <Routes>
        <Route path="/employees/:id/print" element={<PrintEmployeePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrintEmployeePage export/print buttons', () => {
  beforeEach(() => {
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
    mockUseSiteSettings.mockReturnValue({
      employeeCardTemplateUrl: 'https://cdn.test/template.png',
      employeeCardBackTemplateUrl: null,
      employeeCardLayout: defaultEmployeeCardLayout,
    })
    FakeImage.pending = []
    vi.stubGlobal('Image', FakeImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps طباعة/تنزيل disabled until the template image finishes loading, then enables them', async () => {
    renderPage()

    const printButton = await screen.findByRole('button', { name: 'طباعة' })
    expect(printButton).toBeDisabled()
    const loadingButtons = screen.getAllByRole('button', { name: 'جارٍ تحميل القالب...' })
    expect(loadingButtons).toHaveLength(2)
    loadingButtons.forEach((button) => expect(button).toBeDisabled())

    FakeImage.resolveAll()

    await waitFor(() => expect(printButton).toBeEnabled())
    expect(await screen.findByRole('button', { name: 'تنزيل كصورة عالية الوضوح' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'تنزيل PDF' })).toBeEnabled()
  })
})
