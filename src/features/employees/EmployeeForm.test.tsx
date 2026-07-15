import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmployeeForm from './EmployeeForm'

const mockGetEmployeeFieldSuggestions = vi.fn()

vi.mock('./api', () => ({
  getEmployeeFieldSuggestions: () => mockGetEmployeeFieldSuggestions(),
}))

vi.mock('../../lib/idCardOcr', () => ({
  extractIdCardFields: vi.fn().mockResolvedValue({
    employeeName: 'SAMPLE TESTNAME EXAMPLE',
    identityNumber: '1111222233',
  }),
}))

describe('EmployeeForm', () => {
  beforeEach(() => {
    mockGetEmployeeFieldSuggestions.mockReset()
    mockGetEmployeeFieldSuggestions.mockResolvedValue({
      authorityName: ['أمانة تجريبية'],
      municipalityName: [],
      profession: [],
      programType: [],
      programCompletionDateHijri: [],
      licenseNumber: [],
      establishmentName: [],
      establishmentNumber: [],
    })
  })


  it('auto-fills the Hijri issue date when the Gregorian issue date changes', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('تاريخ إصدار الشهادة الصحية ميلادي') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-06-30' } })

    const hijriInput = screen.getByLabelText('تاريخ إصدار الشهادة الصحية هجري') as HTMLInputElement
    expect(hijriInput.value).toBe('1448/01/15')
  })

  it('auto-fills the Hijri expiry date when the Gregorian expiry date changes', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('تاريخ نهاية الشهادة الصحية ميلادي') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2027-06-30' } })

    const hijriInput = screen.getByLabelText('تاريخ نهاية الشهادة الصحية هجري') as HTMLInputElement
    // 365 Gregorian days is a little over one Hijri year (~354 days).
    expect(hijriInput.value).toBe('1449/01/25')
  })

  it('still allows the Hijri field to be edited manually after auto-fill', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('تاريخ إصدار الشهادة الصحية ميلادي') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-06-30' } })

    const hijriInput = screen.getByLabelText('تاريخ إصدار الشهادة الصحية هجري') as HTMLInputElement
    fireEvent.change(hijriInput, { target: { value: '1448/01/16' } })
    expect(hijriInput.value).toBe('1448/01/16')
  })

  it('marks plain Arabic text fields (and the gender select) as dir="rtl"', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('الأمانة')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('الاسم')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('الجنس')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('الجنسية')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('المهنة')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('اسم المنشأة')).toHaveAttribute('dir', 'rtl')
  })

  it('honors provided defaultValues', () => {
    render(
      <EmployeeForm
        defaultValues={{ issueDateGregorian: '2026-06-30', issueDateHijri: '1448/01/15' }}
        isSubmitting={false}
        submitLabel="حفظ"
        onSubmit={vi.fn()}
      />,
    )

    expect(
      (screen.getByLabelText('تاريخ إصدار الشهادة الصحية ميلادي') as HTMLInputElement).value,
    ).toBe('2026-06-30')
    expect(
      (screen.getByLabelText('تاريخ إصدار الشهادة الصحية هجري') as HTMLInputElement).value,
    ).toBe('1448/01/15')
  })

  it('offers previously used values as a pick-list for repeatable fields', async () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('الأمانة')
    await waitFor(() => {
      const list = document.getElementById(input.getAttribute('list')!)
      expect(list?.querySelector('option[value="أمانة تجريبية"]')).toBeTruthy()
    })
  })

  it('does not fetch suggestions or show the ID-scan section in preview mode', () => {
    render(
      <EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} previewMode />,
    )

    expect(mockGetEmployeeFieldSuggestions).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('استخراج البيانات من صورة الهوية (اختياري)')).toBeNull()
  })

  it('fills fields extracted from an uploaded ID card image', async () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const idInput = screen.getByLabelText('استخراج البيانات من صورة الهوية (اختياري)')
    const file = new File(['fake-image-bytes'], 'id.jpg', { type: 'image/jpeg' })
    await userEvent.upload(idInput, file)

    await waitFor(() => {
      expect((screen.getByLabelText('الاسم') as HTMLInputElement).value).toBe(
        'SAMPLE TESTNAME EXAMPLE',
      )
      expect((screen.getByLabelText('رقم الهوية') as HTMLInputElement).value).toBe('1111222233')
    })
    expect(screen.getByText(/تم استخراج 2 حقل\/حقول/)).toBeInTheDocument()
  })
})
