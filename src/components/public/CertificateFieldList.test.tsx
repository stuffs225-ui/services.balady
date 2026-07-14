import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CertificateFieldList from './CertificateFieldList'
import type { PublicCertificate } from '../../types/database'

const certificate: PublicCertificate = {
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
}

describe('CertificateFieldList', () => {
  it('renders all 17 fields in the required order', () => {
    render(<CertificateFieldList certificate={certificate} />)
    const labels = screen.getAllByText(
      /الأمانة|البلدية|الاسم|رقم الهوية|الجنس|الجنسية|رقم الشهادة الصحية|المهنة|تاريخ|نوع البرنامج|رقم الرخصة|اسم المنشأة|رقم المنشأة/,
    )
    expect(labels.length).toBeGreaterThanOrEqual(17)
    expect(labels[0]).toHaveTextContent('الأمانة')
    expect(labels[1]).toHaveTextContent('البلدية')
    expect(labels[2]).toHaveTextContent('الاسم')
  })

  it('highlights hijri date fields when that preference is selected', () => {
    render(<CertificateFieldList certificate={certificate} datePreference="hijri" />)
    const hijriValue = screen.getByText('1448/01/15')
    expect(hijriValue.className).toContain('border-brand-primary')
    const gregorianValue = screen.getByText('2026-06-30')
    expect(gregorianValue.className).not.toContain('border-brand-primary')
  })

  it('highlights gregorian date fields when that preference is selected', () => {
    render(<CertificateFieldList certificate={certificate} datePreference="gregorian" />)
    const gregorianValue = screen.getByText('2026-06-30')
    expect(gregorianValue.className).toContain('border-brand-primary')
  })

  it('never reorders fields based on date preference', () => {
    const { container } = render(
      <CertificateFieldList certificate={certificate} datePreference="hijri" />,
    )
    const labelTexts = Array.from(container.querySelectorAll('span')).map((el) => el.textContent)
    expect(labelTexts[0]).toBe('الأمانة')
    expect(labelTexts[8]).toBe('تاريخ إصدار الشهادة الصحية هجري')
    expect(labelTexts[9]).toBe('تاريخ إصدار الشهادة الصحية ميلادي')
  })
})
