import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_VALIDITY_DAYS,
  addDaysISO,
  displayDateOnly,
  gregorianToHijri,
  normalizeDateOnly,
  todayDateOnly,
} from './dates'

describe('todayDateOnly', () => {
  it('returns an ISO date string (YYYY-MM-DD)', () => {
    expect(todayDateOnly()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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

describe('normalizeDateOnly', () => {
  it('passes an already-canonical YYYY-MM-DD value through unchanged', () => {
    expect(normalizeDateOnly('2026-07-15')).toBe('2026-07-15')
  })

  it('converts a YYYY/MM/DD display value to the canonical dash form', () => {
    expect(normalizeDateOnly('2026/07/15')).toBe('2026-07-15')
  })

  it('never guesses at an ambiguous or localized value', () => {
    expect(normalizeDateOnly('Jul 15 2026')).toBe('')
    expect(normalizeDateOnly('15 Jul 2026')).toBe('')
    expect(normalizeDateOnly('not-a-date')).toBe('')
  })

  it('returns an empty string for missing values', () => {
    expect(normalizeDateOnly(null)).toBe('')
    expect(normalizeDateOnly(undefined)).toBe('')
    expect(normalizeDateOnly('')).toBe('')
  })
})

describe('displayDateOnly', () => {
  it('renders a stored ISO date as slash-separated YYYY/MM/DD', () => {
    expect(displayDateOnly('2026-06-30')).toBe('2026/06/30')
  })

  it('renders an already-slash value the same way', () => {
    expect(displayDateOnly('2026/06/30')).toBe('2026/06/30')
  })

  it('never fabricates a date from an ambiguous or localized value', () => {
    expect(displayDateOnly('Jul 15 2026')).toBe('–')
    expect(displayDateOnly('15 Jul 2026')).toBe('–')
  })

  it('returns a dash for missing values', () => {
    expect(displayDateOnly(null)).toBe('–')
    expect(displayDateOnly(undefined)).toBe('–')
    expect(displayDateOnly('')).toBe('–')
  })
})
