import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import EmployeeCardRenderer, { fieldValue, fieldFontSize } from './EmployeeCardRenderer'
import { defaultEmployeeCardLayout } from '../../config/employeeCardLayout'
import type { Employee } from '../../types/database'

vi.mock('../../features/employees/api', () => ({
  // Never resolves within the test — if the component still shows the
  // photo, it must be using the override prop, not this fetch.
  getEmployeePhotoUrl: vi.fn(() => new Promise(() => {})),
}))

vi.mock('../../lib/qrcode', () => ({
  generateQrDataUrl: vi.fn(() => new Promise(() => {})),
}))

const FAKE_EMPLOYEE: Employee = {
  id: 'fake-id',
  public_token: 'fake-token-0000000000',
  employee_name: 'اسم تجريبي',
  identity_number: '1000000000',
  gender: 'ذكر',
  nationality: 'جنسية تجريبية',
  profession: 'مهنة تجريبية',
  authority_name: 'أمانة تجريبية',
  municipality_name: 'بلدية تجريبية',
  certificate_number: 'CERT-DEMO-0000',
  license_number: null,
  establishment_name: 'منشأة تجريبية',
  establishment_number: null,
  program_type: null,
  issue_date_hijri: null,
  issue_date_gregorian: '2026-01-01',
  expiry_date_hijri: null,
  expiry_date_gregorian: '2027-01-01',
  program_completion_date_hijri: null,
  employee_photo_path: 'fake-token-0000000000/photo',
  employee_photo_crop: null,
  employee_card_overrides: null,
  visit_count: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('EmployeeCardRenderer', () => {
  it('renders the photo and QR immediately from override props, without waiting on the async fetch', async () => {
    render(
      <EmployeeCardRenderer
        templateUrl="https://example.test/template.png"
        employee={FAKE_EMPLOYEE}
        publicUrl="https://example.test/e/fake-token"
        exportMode
        photoUrlOverride="data:image/png;base64,fakephotobytes"
        qrDataUrlOverride="data:image/png;base64,fakeqrbytes"
      />,
    )

    const photo = await screen.findByAltText('اسم تجريبي')
    expect(photo).toHaveAttribute('src', 'data:image/png;base64,fakephotobytes')

    const qr = await screen.findByAltText('رمز الاستجابة السريعة')
    expect(qr).toHaveAttribute('src', 'data:image/png;base64,fakeqrbytes')
  })

  it('falls back to the async fetch when no override is provided', async () => {
    render(
      <EmployeeCardRenderer
        templateUrl="https://example.test/template.png"
        employee={FAKE_EMPLOYEE}
        publicUrl="https://example.test/e/fake-token"
      />,
    )

    // The fetches never resolve in this test, so neither the photo nor the
    // QR should ever appear.
    await waitFor(() => {
      expect(screen.queryByAltText('اسم تجريبي')).toBeNull()
      expect(screen.queryByAltText('رمز الاستجابة السريعة')).toBeNull()
    })
  })
})

describe('fieldValue with per-employee overrides', () => {
  it('uses the default value when there is no override', () => {
    expect(fieldValue(FAKE_EMPLOYEE, 'fullName')).toBe('اسم تجريبي')
  })

  it('uses the override text when one is set for the field', () => {
    const employee: Employee = {
      ...FAKE_EMPLOYEE,
      employee_card_overrides: { fullName: { text: 'اسم مخصص لهذا الموظف' } },
    }
    expect(fieldValue(employee, 'fullName')).toBe('اسم مخصص لهذا الموظف')
  })

  it('does not let an override on one field leak into another field', () => {
    const employee: Employee = {
      ...FAKE_EMPLOYEE,
      employee_card_overrides: { fullName: { text: 'اسم مخصص' } },
    }
    expect(fieldValue(employee, 'profession')).toBe('مهنة تجريبية')
  })
})

describe('fieldFontSize with per-employee overrides', () => {
  it('falls back to the shared layout font size when there is no override', () => {
    expect(fieldFontSize(FAKE_EMPLOYEE, 'fullName', defaultEmployeeCardLayout)).toBe(
      defaultEmployeeCardLayout.fullName.fontSize,
    )
  })

  it('uses the override font size when one is set for the field', () => {
    const employee: Employee = {
      ...FAKE_EMPLOYEE,
      employee_card_overrides: { fullName: { fontSize: 50 } },
    }
    expect(fieldFontSize(employee, 'fullName', defaultEmployeeCardLayout)).toBe(50)
  })
})
