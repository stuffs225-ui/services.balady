import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmployeePortrait from './EmployeePortrait'

describe('EmployeePortrait', () => {
  it('renders the photo box at a fixed 184x184px, not a fluid size', () => {
    render(<EmployeePortrait photoUrl="https://cdn.test/photo.jpg" employeeName="موظف تجريبي" />)
    const img = screen.getByAltText('موظف تجريبي')
    const box = img.parentElement!
    expect(box.className).toContain('h-[184px]')
    expect(box.className).toContain('w-[184px]')
    expect(box.className).not.toContain('clamp')
  })

  it('renders a same-size placeholder when there is no photo', () => {
    render(<EmployeePortrait photoUrl={null} employeeName="موظف تجريبي" />)
    const placeholder = screen.getByText('لا توجد صورة')
    expect(placeholder.className).toContain('h-[184px]')
    expect(placeholder.className).toContain('w-[184px]')
  })
})
