import { describe, expect, it } from 'vitest'
import { parseIdCardText } from './idCardOcr'

// Fictional OCR output shaped like a Saudi Iqama/ID card layout — never
// real personal data.
const SAMPLE_OCR_TEXT = `
هوية مقيم
المملكة العربية السعودية
SAMPLE TESTNAME EXAMPLE
رقم الهوية
1111222233
تاريخ الميلاد
1999/01/01
الجنسية
مصر
الديانة
الاسلام
المهنة
نجار
تاريخ الاصدار
2024/01/01
منطقة العمل
الرياض
اسم صاحب العمل
مؤسسة الاختبار التجريبية
هوية صاحب العمل
7001234567
`

describe('parseIdCardText', () => {
  it('extracts the English name line', () => {
    expect(parseIdCardText(SAMPLE_OCR_TEXT).employeeName).toBe('SAMPLE TESTNAME EXAMPLE')
  })

  it('extracts the identity number from its label', () => {
    expect(parseIdCardText(SAMPLE_OCR_TEXT).identityNumber).toBe('1111222233')
  })

  it('extracts nationality and profession', () => {
    const fields = parseIdCardText(SAMPLE_OCR_TEXT)
    expect(fields.nationality).toBe('مصر')
    expect(fields.profession).toBe('نجار')
  })

  it('extracts the employer name and number, not the work-region line', () => {
    const fields = parseIdCardText(SAMPLE_OCR_TEXT)
    expect(fields.establishmentName).toBe('مؤسسة الاختبار التجريبية')
    expect(fields.establishmentNumber).toBe('7001234567')
  })

  it('never extracts certificate-only fields that are not on an ID card', () => {
    const fields = parseIdCardText(SAMPLE_OCR_TEXT)
    expect(fields).not.toHaveProperty('authorityName')
    expect(fields).not.toHaveProperty('certificateNumber')
    expect(fields).not.toHaveProperty('issueDateGregorian')
  })

  it('falls back to a bare 10-digit run when there is no identity-number label', () => {
    const fields = parseIdCardText('بعض النصوص\n2233445566\nنص آخر')
    expect(fields.identityNumber).toBe('2233445566')
  })

  it('returns an empty object for unrecognizable text', () => {
    expect(parseIdCardText('نص عشوائي بدون أي حقول معروفة')).toEqual({})
  })
})
