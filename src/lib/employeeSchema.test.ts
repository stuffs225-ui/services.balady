import { describe, expect, it } from 'vitest'
import { employeeFormSchema } from './employeeSchema'

const validBase = {
  authorityName: 'أمانة المنطقة التجريبية',
  municipalityName: 'بلدية النموذج',
  employeeName: 'أحمد محمد التجريبي',
  identityNumber: '1234567890',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  certificateNumber: 'CERT-DEMO-2026-001',
  profession: 'محاسب',
  issueDateHijri: '1448/01/15',
  issueDateGregorian: '2026-06-30',
  expiryDateHijri: '1449/01/15',
  expiryDateGregorian: '2027-06-30',
  programType: 'منشآت الغذاء',
  programCompletionDateHijri: '1451/01/15',
  licenseNumber: 'LIC-DEMO-001',
  establishmentName: 'شركة النموذج التجريبية',
  establishmentNumber: 'EST-DEMO-001',
}

describe('employeeFormSchema', () => {
  it('accepts a fully valid submission', () => {
    const result = employeeFormSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('requires the identity number to be exactly 10 digits', () => {
    expect(employeeFormSchema.safeParse({ ...validBase, identityNumber: '123456789' }).success).toBe(
      false,
    )
    expect(
      employeeFormSchema.safeParse({ ...validBase, identityNumber: '12345678901' }).success,
    ).toBe(false)
    expect(
      employeeFormSchema.safeParse({ ...validBase, identityNumber: '123456789a' }).success,
    ).toBe(false)
    expect(
      employeeFormSchema.safeParse({ ...validBase, identityNumber: '1234567890' }).success,
    ).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = employeeFormSchema.safeParse({ ...validBase, employeeName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an expiry date before the issue date', () => {
    const result = employeeFormSchema.safeParse({
      ...validBase,
      issueDateGregorian: '2027-01-01',
      expiryDateGregorian: '2026-01-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('expiryDateGregorian')
    }
  })

  it('accepts an expiry date equal to the issue date', () => {
    const result = employeeFormSchema.safeParse({
      ...validBase,
      issueDateGregorian: '2026-06-30',
      expiryDateGregorian: '2026-06-30',
    })
    expect(result.success).toBe(true)
  })

  it('allows optional fields to be empty', () => {
    const result = employeeFormSchema.safeParse({
      ...validBase,
      programType: '',
      licenseNumber: '',
      establishmentNumber: '',
      issueDateHijri: '',
      expiryDateHijri: '',
      programCompletionDateHijri: '',
    })
    expect(result.success).toBe(true)
  })
})
