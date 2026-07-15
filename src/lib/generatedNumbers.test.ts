import { describe, expect, it } from 'vitest'
import { generateCertificateNumber, generateLicenseNumber } from './generatedNumbers'

describe('generateCertificateNumber', () => {
  it('starts with 47, followed by a 4-digit day/month and 6 random digits', () => {
    const value = generateCertificateNumber()
    expect(value).toMatch(/^47\d{10}$/)
  })

  it('is different across separate calls (random tail)', () => {
    const values = new Set(Array.from({ length: 20 }, () => generateCertificateNumber()))
    expect(values.size).toBeGreaterThan(1)
  })
})

describe('generateLicenseNumber', () => {
  it('starts with 47, followed by a 4-digit day/month and 6 random digits', () => {
    const value = generateLicenseNumber()
    expect(value).toMatch(/^47\d{10}$/)
  })

  it('is different across separate calls (random tail)', () => {
    const values = new Set(Array.from({ length: 20 }, () => generateLicenseNumber()))
    expect(values.size).toBeGreaterThan(1)
  })
})
