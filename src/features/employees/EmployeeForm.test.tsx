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


  it('keeps the default field order when prioritizeManualEntry is not set', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)
    const labels = screen.getAllByText(/^(الأمانة|رقم الشهادة الصحية|اسم المنشأة)$/).map((el) => el.textContent)
    // Default order: certificateNumber comes before establishmentName.
    expect(labels.indexOf('رقم الشهادة الصحية')).toBeLessThan(labels.indexOf('اسم المنشأة'))
  })

  it('moves fields the admin must type to the top when prioritizeManualEntry is set, auto-filled ones last', () => {
    render(
      <EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} prioritizeManualEntry />,
    )
    const labels = screen
      .getAllByText(/^(الأمانة|رقم الشهادة الصحية|اسم المنشأة|رقم الرخصة)$/)
      .map((el) => el.textContent)
    // establishmentName/authorityName (typed manually) must come before
    // certificateNumber/licenseNumber (auto-filled on the new-employee form).
    expect(labels.indexOf('الأمانة')).toBeLessThan(labels.indexOf('رقم الشهادة الصحية'))
    expect(labels.indexOf('اسم المنشأة')).toBeLessThan(labels.indexOf('رقم الشهادة الصحية'))
    expect(labels.indexOf('اسم المنشأة')).toBeLessThan(labels.indexOf('رقم الرخصة'))
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

  it('auto-fills the program completion Hijri date as issue date + 1095 days when the issue date changes', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('تاريخ إصدار الشهادة الصحية ميلادي') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-06-30' } })

    const programCompletionInput = screen.getByLabelText(
      'تاريخ انتهاء البرنامج التثقيفي',
    ) as HTMLInputElement
    expect(programCompletionInput.value).toBe('1451/02/17')
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
    ).toBe('2026/06/30')
    expect(
      (screen.getByLabelText('تاريخ إصدار الشهادة الصحية هجري') as HTMLInputElement).value,
    ).toBe('1448/01/15')
  })

  it('renders the Gregorian date fields as a masked YYYY/MM/DD text input, not a native date picker', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const dateInput = screen.getByLabelText(
      'تاريخ إصدار الشهادة الصحية ميلادي',
    ) as HTMLInputElement
    // A native <input type="date">'s displayed text is controlled by the
    // OS/browser locale (e.g. "15 Jul 2026" on some iOS locales) and can't
    // be forced into a fixed format — this must be a plain text input so
    // the app fully controls what's shown.
    expect(dateInput.type).toBe('text')
    expect(dateInput).toHaveAttribute('dir', 'ltr')
    expect(dateInput.style.direction).toBe('ltr')
    expect(dateInput).toHaveAttribute('inputMode', 'numeric')
    expect(dateInput).toHaveAttribute('placeholder', 'YYYY/MM/DD')
    expect(dateInput).toHaveAttribute('maxLength', '10')
  })

  it('formats typed digits into YYYY/MM/DD as the user types', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const dateInput = screen.getByLabelText(
      'تاريخ إصدار الشهادة الصحية ميلادي',
    ) as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '20260715' } })

    expect(dateInput.value).toBe('2026/07/15')
  })

  it('sets the direction/alignment as inline CSS too, not just the dir attribute', () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const nameInput = screen.getByLabelText('الاسم')
    expect(nameInput).toHaveAttribute('dir', 'rtl')
    expect(nameInput.style.direction).toBe('rtl')
    expect(nameInput.style.textAlign).toBe('right')

    const idInput = screen.getByLabelText('رقم الهوية')
    expect(idInput.style.direction).toBe('ltr')
  })

  it('offers previously used values as a pick-list for repeatable fields', async () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const input = screen.getByLabelText('الأمانة')
    await waitFor(() => {
      const list = document.getElementById(input.getAttribute('list')!)
      expect(list?.querySelector('option[value="أمانة تجريبية"]')).toBeTruthy()
    })
  })

  it('opens the crop calibration modal after selecting a photo, and only shows the preview once confirmed', async () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const photoInput = screen.getByLabelText('الصورة الشخصية') as HTMLInputElement
    const file = new File(['fake-photo-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(photoInput, file)

    expect(screen.getByText('معايرة الصورة الشخصية')).toBeInTheDocument()
    expect(screen.queryByAltText('معاينة الصورة الشخصية')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

    await waitFor(() => {
      expect(screen.queryByText('معايرة الصورة الشخصية')).toBeNull()
      expect(screen.getByAltText('معاينة الصورة الشخصية')).toBeInTheDocument()
    })
  })

  it('discards the selected photo when calibration is cancelled', async () => {
    render(<EmployeeForm isSubmitting={false} submitLabel="حفظ" onSubmit={vi.fn()} />)

    const photoInput = screen.getByLabelText('الصورة الشخصية') as HTMLInputElement
    const file = new File(['fake-photo-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(photoInput, file)

    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))

    expect(screen.queryByText('معايرة الصورة الشخصية')).toBeNull()
    expect(screen.queryByAltText('معاينة الصورة الشخصية')).toBeNull()
    expect(photoInput.value).toBe('')
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
