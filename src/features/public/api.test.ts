import { describe, expect, it, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
vi.mock('../../lib/supabase', () => ({
  EMPLOYEE_PHOTOS_BUCKET: 'employee-photos',
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    storage: { from: () => ({ createSignedUrl: () => ({ data: null }) }) },
  },
}))

import { fetchPublicCertificate } from './api'

const baseCertificate = {
  employee_name: 'موظف تجريبي',
  identity_number: '*******609',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  profession: 'محاسب',
  authority_name: 'أمانة',
  municipality_name: 'بلدية',
  certificate_number: 'CERT-DEMO',
  license_number: null,
  establishment_name: 'منشأة',
  establishment_number: null,
  program_type: null,
  issue_date_hijri: null,
  issue_date_gregorian: '2026-06-30',
  expiry_date_hijri: null,
  expiry_date_gregorian: '2027-06-30',
  program_completion_date_hijri: null,
  has_photo: false,
}

describe('fetchPublicCertificate', () => {
  beforeEach(() => rpc.mockReset())

  it('collapses a legacy "expiring" status from the RPC to "active"', async () => {
    rpc.mockResolvedValue({ data: [{ ...baseCertificate, status: 'expiring' }], error: null })
    const result = await fetchPublicCertificate('some-valid-token')
    expect(result.kind).toBe('found')
    if (result.kind === 'found') {
      expect(result.certificate.status).toBe('active')
    }
  })

  it('passes through active/expired/revoked statuses unchanged', async () => {
    rpc.mockResolvedValue({ data: [{ ...baseCertificate, status: 'expired' }], error: null })
    const result = await fetchPublicCertificate('some-valid-token')
    expect(result.kind).toBe('found')
    if (result.kind === 'found') {
      expect(result.certificate.status).toBe('expired')
    }
  })

  it('returns not-found when the RPC yields no rows', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    const result = await fetchPublicCertificate('x')
    expect(result.kind).toBe('not-found')
  })

  it('returns network-error when the RPC errors', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const result = await fetchPublicCertificate('x')
    expect(result.kind).toBe('network-error')
  })
})
