import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmployeePortrait from './EmployeePortrait'

describe('EmployeePortrait', () => {
  it('renders the photo at a fixed 184x184px, not a fluid size', () => {
    render(<EmployeePortrait photoUrl="https://cdn.test/photo.jpg" employeeName="موظف تجريبي" />)
    const img = screen.getByAltText('موظف تجريبي')
    expect(img.className).toContain('h-[184px]')
    expect(img.className).toContain('w-[184px]')
    expect(img.className).not.toContain('clamp')
  })

  it('renders a same-size placeholder when there is no photo', () => {
    render(<EmployeePortrait photoUrl={null} employeeName="موظف تجريبي" />)
    const placeholder = screen.getByText('لا توجد صورة')
    expect(placeholder.className).toContain('h-[184px]')
    expect(placeholder.className).toContain('w-[184px]')
  })
})
