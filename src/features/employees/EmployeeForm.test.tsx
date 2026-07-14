import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmployeeForm from './EmployeeForm'

describe('EmployeeForm', () => {
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
})
