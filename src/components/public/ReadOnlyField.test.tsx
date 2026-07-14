import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReadOnlyField from './ReadOnlyField'

describe('ReadOnlyField', () => {
  it('renders a 44px field height at the target size', () => {
    render(<ReadOnlyField label="الجنس" value="ذكر" />)
    const value = screen.getByText('ذكر')
    expect(value.className).toContain('min-h-[44px]')
    expect(value.className).toContain('text-[17px]')
  })

  it('renders a 16px label by default', () => {
    render(<ReadOnlyField label="الجنس" value="ذكر" />)
    expect(screen.getByText('الجنس').className).toContain('text-[16px]')
  })

  it('shrinks long date/program labels to 15px', () => {
    render(
      <ReadOnlyField label="تاريخ إصدار الشهادة الصحية هجري" value="1448/01/15" dir="ltr" />,
    )
    expect(screen.getByText('تاريخ إصدار الشهادة الصحية هجري').className).toContain('text-[15px]')
  })

  it('right-aligns values regardless of dir (never left-aligns)', () => {
    const { rerender } = render(<ReadOnlyField label="الجنس" value="ذكر" dir="rtl" />)
    expect(screen.getByText('ذكر').className).toContain('justify-end')
    expect(screen.getByText('ذكر').className).not.toContain('justify-start')

    rerender(<ReadOnlyField label="رقم الهوية" value="1234567890" dir="ltr" />)
    const numericValue = screen.getByText('1234567890')
    expect(numericValue.className).toContain('justify-end')
    expect(numericValue.className).not.toContain('justify-start')
  })

  it('shows a simple dash for missing values', () => {
    render(<ReadOnlyField label="رقم الرخصة" value={null} />)
    expect(screen.getByText('–')).toBeInTheDocument()
  })
})
