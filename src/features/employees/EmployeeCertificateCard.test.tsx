import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmployeeCertificateCard from './EmployeeCertificateCard'
import type { Employee } from '../../types/database'

const employee: Employee = {
  id: 'emp-1',
  public_token: 'token-abc',
  employee_name: 'موظف تجريبي',
  identity_number: '1234567890',
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
  employee_photo_path: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('EmployeeCertificateCard', () => {
  it('renders the employee name and fields in the required order', () => {
    const { container } = render(
      <EmployeeCertificateCard employee={employee} photoUrl={null} qrDataUrl={null} />,
    )

    expect(screen.getByText('موظف تجريبي')).toBeInTheDocument()

    const labels = Array.from(container.querySelectorAll('.certificate-field-label')).map(
      (el) => el.textContent,
    )
    expect(labels).toEqual([
      'رقم الهوية',
      'الجنسية',
      'رقم الشهادة الصحية',
      'المهنة',
      'تاريخ إصدار الشهادة الصحية',
      'تاريخ نهاية الشهادة الصحية',
      'نوع البرنامج التثقيفي',
      'تاريخ انتهاء البرنامج التثقيفي',
    ])
  })

  it('shows the hijri issue/expiry dates and program completion date, not gregorian', () => {
    render(<EmployeeCertificateCard employee={employee} photoUrl={null} qrDataUrl={null} />)

    expect(screen.getByText('1448/01/15')).toBeInTheDocument()
    expect(screen.getByText('1449/01/15')).toBeInTheDocument()
    expect(screen.getByText('1451/01/15')).toBeInTheDocument()
    expect(screen.queryByText('2026-06-30')).not.toBeInTheDocument()
  })

  it('renders a placeholder box instead of any image when no photo is uploaded', () => {
    const { container } = render(
      <EmployeeCertificateCard employee={employee} photoUrl={null} qrDataUrl={null} />,
    )
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('renders the employee photo and QR code when provided', () => {
    render(
      <EmployeeCertificateCard
        employee={employee}
        photoUrl="https://cdn.test/photo.jpg"
        qrDataUrl="data:image/png;base64,abc"
      />,
    )

    expect(screen.getByAltText('موظف تجريبي')).toHaveAttribute('src', 'https://cdn.test/photo.jpg')
    expect(screen.getByAltText('رمز الاستجابة السريعة')).toHaveAttribute(
      'src',
      'data:image/png;base64,abc',
    )
  })

  it('shows the demo disclaimer on the card itself so it survives printing', () => {
    render(<EmployeeCertificateCard employee={employee} photoUrl={null} qrDataUrl={null} />)
    expect(screen.getByText('(نسخة تجريبية)')).toBeInTheDocument()
  })
})
