import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicEmployeePage from './PublicEmployeePage'
import type { PublicCertificateResult } from './api'

const mockFetch = vi.fn<(token: string) => Promise<PublicCertificateResult>>()
vi.mock('./api', () => ({
  fetchPublicCertificate: (token: string) => mockFetch(token),
}))

function renderAtToken(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/e/${token}`]}>
      <Routes>
        <Route path="/e/:token" element={<PublicEmployeePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublicEmployeePage', () => {
  it('shows a generic not-found state for an invalid token', async () => {
    mockFetch.mockResolvedValue({ kind: 'not-found' })
    renderAtToken('does-not-exist')

    expect(await screen.findByText('تعذر التحقق من الشهادة')).toBeInTheDocument()
    expect(screen.getByText('الرابط غير صالح أو لم يعد متاحًا.')).toBeInTheDocument()
  })

  it('renders certificate fields for a valid token', async () => {
    mockFetch.mockResolvedValue({
      kind: 'found',
      photoUrl: null,
      certificate: {
        employee_name: 'أحمد محمد التجريبي',
        identity_number_masked: '*******609',
        gender: 'ذكر',
        nationality: 'الجنسية التجريبية',
        profession: 'محاسب',
        authority_name: 'أمانة المنطقة التجريبية',
        municipality_name: 'بلدية النموذج',
        certificate_number: 'CERT-DEMO-2026-001',
        license_number: 'LIC-DEMO-001',
        establishment_name: 'شركة النموذج التجريبية',
        establishment_number: 'EST-DEMO-001',
        program_type: 'منشآت الغذاء',
        issue_date_hijri: '1448/01/15',
        issue_date_gregorian: '2026-06-30',
        expiry_date_hijri: '1449/01/15',
        expiry_date_gregorian: '2027-06-30',
        program_completion_date_hijri: '1451/01/15',
        has_photo: false,
        status: 'active',
      },
    })

    renderAtToken('valid-token')

    expect(await screen.findByText('أحمد محمد التجريبي')).toBeInTheDocument()
    expect(screen.getByText('*******609')).toBeInTheDocument()
    expect(screen.getByText('CERT-DEMO-2026-001')).toBeInTheDocument()
    expect(screen.getByText('سارية')).toBeInTheDocument()
    // Full identity number must never render anywhere on the page.
    expect(screen.queryByText(/2547109609/)).not.toBeInTheDocument()
  })

  it('shows the revoked banner message for a deactivated certificate', async () => {
    mockFetch.mockResolvedValue({
      kind: 'found',
      photoUrl: null,
      certificate: {
        employee_name: 'أحمد محمد التجريبي',
        identity_number_masked: '*******609',
        gender: 'ذكر',
        nationality: 'الجنسية التجريبية',
        profession: 'محاسب',
        authority_name: 'أمانة المنطقة التجريبية',
        municipality_name: 'بلدية النموذج',
        certificate_number: 'CERT-DEMO-2026-001',
        license_number: null,
        establishment_name: 'شركة النموذج التجريبية',
        establishment_number: null,
        program_type: null,
        issue_date_hijri: null,
        issue_date_gregorian: '2026-06-30',
        expiry_date_hijri: null,
        expiry_date_gregorian: '2027-06-30',
        program_completion_date_hijri: null,
        has_photo: false,
        status: 'revoked',
      },
    })

    renderAtToken('revoked-token')

    await waitFor(() => expect(screen.getByText('هذه الشهادة ملغاة')).toBeInTheDocument())
  })
})
