import { describe, expect, it } from 'vitest'
import { getEmployeeRegistrationDate } from './employeeRegistrationDate'
import type { Employee } from '../types/database'

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

describe('getEmployeeRegistrationDate', () => {
  it('returns created_at when the employee has never been reactivated', () => {
    const employee = makeEmployee({ created_at: '2026-01-01T12:00:00Z', reactivated_at: null })
    expect(getEmployeeRegistrationDate(employee)).toBe('2026-01-01T12:00:00Z')
  })

  it('returns reactivated_at instead of created_at once the employee has been reactivated', () => {
    const employee = makeEmployee({
      created_at: '2026-01-01T12:00:00Z',
      reactivated_at: '2026-07-21T09:30:00Z',
    })
    expect(getEmployeeRegistrationDate(employee)).toBe('2026-07-21T09:30:00Z')
  })
})
