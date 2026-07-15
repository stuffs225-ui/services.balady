import { describe, expect, it } from 'vitest'
import { parseIdCardText } from './idCardOcr'

// Fictional OCR output shaped like a real Saudi Iqama/resident ID card
// layout (two label:value pairs packed on some physical rows, Arabic-Indic
// digits, Arabic name printed above its English transliteration) — never
// real personal data.
const SAMPLE_OCR_TEXT = `
هوية مقيم
رقم النسخة ١
المملكة العربية السعودية
وزارة الداخلية
اسم تجريبي رباعي هنا
SAMPLE TESTNAME EXAMPLE
رقم الهوية: ١١١١٢٢٢٢٣٣ تاريخ الانتهاء: ٢٠٢٦/٠١/٠١
تاريخ الميلاد: ١٩٩٩/٠١/٠١ الجنسية: مصر
الديانة: الاسلام
المهنة: نجار
هوية صاحب العمل: ٧٠٠١٢٣٤٥٦٧
مكان الإصدار: مؤسسة الاختبار
مكان العمل: الرياض
اسم صاحب العمل: مؤسسة الاختبار التجريبية للمقاولات
`

describe('parseIdCardText', () => {
  it('extracts the Arabic name line, not the English transliteration below it', () => {
    expect(parseIdCardText(SAMPLE_OCR_TEXT).employeeName).toBe('اسم تجريبي رباعي هنا')
  })

  it('extracts the identity number as Latin digits, even though the card prints Arabic-Indic digits', () => {
    expect(parseIdCardText(SAMPLE_OCR_TEXT).identityNumber).toBe('1111222233')
  })

  it('does not glue the identity number and the expiry date together when they share a line', () => {
    const fields = parseIdCardText(SAMPLE_OCR_TEXT)
    expect(fields.identityNumber).not.toContain('2026')
    expect(fields.identityNumber).toHaveLength(10)
  })

  it('extracts nationality and profession', () => {
    const fields = parseIdCardText(SAMPLE_OCR_TEXT)
    expect(fields.nationality).toBe('مصر')
    expect(fields.profession).toBe('نجار')
  })

  it('extracts the employer name, not the employer ID-number line (both share the "صاحب العمل" substring)', () => {
    const fields = parseIdCardText(SAMPLE_OCR_TEXT)
    expect(fields.establishmentName).toBe('مؤسسة الاختبار التجريبية للمقاولات')
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

  it('converts a bare Arabic-Indic 10-digit run too, via the fallback path', () => {
    const fields = parseIdCardText('بعض النصوص\n٢٢٣٣٤٤٥٥٦٦\nنص آخر')
    expect(fields.identityNumber).toBe('2233445566')
  })

  it('finds the value when it appears before its label on the same line', () => {
    // Some rows can come out of OCR with the value first and the label
    // after it, depending on how bidi text gets reconstructed.
    const fields = parseIdCardText('مؤسسة تجريبية أخرى اسم صاحب العمل:')
    expect(fields.establishmentName).toBe('مؤسسة تجريبية أخرى')
  })

  it('returns an empty object for unrecognizable text', () => {
    expect(parseIdCardText('نص عشوائي بدون أي حقول معروفة')).toEqual({})
  })
})
