import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_VALIDITY_DAYS,
  addDaysISO,
  formatGregorianDisplay,
  gregorianToHijri,
  todayISO,
} from './dates'

describe('todayISO', () => {
  it('returns an ISO date string (YYYY-MM-DD)', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('addDaysISO', () => {
  it('adds the default 365-day certificate validity window', () => {
    expect(addDaysISO('2026-06-30', CERTIFICATE_VALIDITY_DAYS)).toBe('2027-06-30')
  })

  it('rolls over month/year boundaries correctly', () => {
    expect(addDaysISO('2026-12-20', 15)).toBe('2027-01-04')
  })

  it('returns an empty string for invalid input', () => {
    expect(addDaysISO('', 365)).toBe('')
  })
})

describe('gregorianToHijri', () => {
  it('converts a known Gregorian date to its Hijri (Umm al-Qura) equivalent', () => {
    expect(gregorianToHijri('2026-06-30')).toBe('1448/01/15')
  })

  it('converts a date 365 days later to the corresponding Hijri date', () => {
    // 365 Gregorian days is a little over one Hijri year (~354 days).
    expect(gregorianToHijri('2027-06-30')).toBe('1449/01/25')
  })

  it('returns an empty string for invalid input', () => {
    expect(gregorianToHijri('')).toBe('')
    expect(gregorianToHijri('not-a-date')).toBe('')
  })
})

describe('formatGregorianDisplay', () => {
  it('renders a stored ISO date as slash-separated YYYY/MM/DD', () => {
    expect(formatGregorianDisplay('2026-06-30')).toBe('2026/06/30')
  })

  it('returns an empty string for missing values', () => {
    expect(formatGregorianDisplay(null)).toBe('')
    expect(formatGregorianDisplay(undefined)).toBe('')
    expect(formatGregorianDisplay('')).toBe('')
  })
})
