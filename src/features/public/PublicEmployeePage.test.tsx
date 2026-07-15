import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
        identity_number: '1234567609',
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
    // The full identity number is shown as-is — the public page no longer
    // masks it.
    expect(screen.getByText('1234567609')).toBeInTheDocument()
    expect(screen.getByText('CERT-DEMO-2026-001')).toBeInTheDocument()
  })

  it('shows different data for two different employee tokens', async () => {
    const baseCertificate = {
      gender: 'ذكر',
      nationality: 'الجنسية التجريبية',
      profession: 'محاسب',
      authority_name: 'أمانة المنطقة التجريبية',
      municipality_name: 'بلدية النموذج',
      license_number: null,
      establishment_number: null,
      program_type: null,
      issue_date_hijri: null,
      issue_date_gregorian: '2026-06-30',
      expiry_date_hijri: null,
      expiry_date_gregorian: '2027-06-30',
      program_completion_date_hijri: null,
      has_photo: false,
      status: 'active' as const,
    }

    mockFetch.mockImplementation(async (token: string) =>
      token === 'token-a'
        ? {
            kind: 'found',
            photoUrl: null,
            certificate: {
              ...baseCertificate,
              employee_name: 'موظف تجريبي أول',
              identity_number: '1234567111',
              certificate_number: 'CERT-DEMO-A',
              establishment_name: 'منشأة أ',
            },
          }
        : {
            kind: 'found',
            photoUrl: null,
            certificate: {
              ...baseCertificate,
              employee_name: 'موظف تجريبي ثاني',
              identity_number: '1234567222',
              certificate_number: 'CERT-DEMO-B',
              establishment_name: 'منشأة ب',
            },
          },
    )

    const first = renderAtToken('token-a')
    expect(await screen.findByText('موظف تجريبي أول')).toBeInTheDocument()
    expect(screen.getByText('CERT-DEMO-A')).toBeInTheDocument()
    first.unmount()

    renderAtToken('token-b')
    expect(await screen.findByText('موظف تجريبي ثاني')).toBeInTheDocument()
    expect(screen.getByText('CERT-DEMO-B')).toBeInTheDocument()
  })

  it('offers a print action once a certificate is found', async () => {
    const printSpy = vi.fn()
    vi.stubGlobal('print', printSpy)

    mockFetch.mockResolvedValue({
      kind: 'found',
      photoUrl: null,
      certificate: {
        employee_name: 'أحمد محمد التجريبي',
        identity_number: '1234567609',
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
        status: 'active',
      },
    })

    renderAtToken('valid-token')
    await screen.findByText('أحمد محمد التجريبي')

    // Print lives inside the settings menu, not as a standalone button in
    // the main content flow.
    await userEvent.click(screen.getByRole('button', { name: 'الإعدادات' }))
    const printButton = await screen.findByRole('button', { name: 'الطباعة' })
    await userEvent.click(printButton)
    expect(printSpy).toHaveBeenCalledOnce()

    vi.unstubAllGlobals()
  })

  it('lets the footer follow content instead of pinning it with a large blank gap', async () => {
    mockFetch.mockResolvedValue({ kind: 'not-found' })
    const { container } = renderAtToken('does-not-exist')
    await screen.findByText('تعذر التحقق من الشهادة')

    const main = container.querySelector('.public-main')!
    const content = container.querySelector('.public-content')!
    expect(main.className).not.toContain('flex-1')
    expect(content.className).not.toMatch(/pb-\[clamp/)
  })
})
