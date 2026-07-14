import { describe, expect, it } from 'vitest'
import { computeCertificateStatus } from './certificateStatus'

const today = new Date('2026-07-14T00:00:00Z')

describe('computeCertificateStatus', () => {
  it('is revoked when inactive, regardless of dates', () => {
    expect(computeCertificateStatus(false, '2030-01-01', today)).toBe('revoked')
  })

  it('is expired when the expiry date has passed', () => {
    expect(computeCertificateStatus(true, '2026-01-01', today)).toBe('expired')
  })

  it('is active (not expiring) even when close to the expiry date', () => {
    expect(computeCertificateStatus(true, '2026-07-30', today)).toBe('active')
  })

  it('is active when well beyond the expiry window', () => {
    expect(computeCertificateStatus(true, '2027-01-01', today)).toBe('active')
  })
})
