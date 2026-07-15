import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmployeePortrait from './EmployeePortrait'

describe('EmployeePortrait', () => {
  it('renders the photo box at a fixed 184x184px, not a fluid size', () => {
    const { container } = render(
      <EmployeePortrait photoUrl="https://cdn.test/photo.jpg" employeeName="موظف تجريبي" />,
    )
    const img = container.querySelector('img')!
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

  it('falls back to the placeholder if the photo fails to load', () => {
    const { container } = render(
      <EmployeePortrait photoUrl="https://cdn.test/broken.jpg" employeeName="موظف تجريبي" />,
    )
    const img = container.querySelector('img')!
    fireEvent.error(img)
    expect(screen.getByText('لا توجد صورة')).toBeInTheDocument()
  })

  it('renders a plain, permanent public Storage URL — the same mechanism as the header logo, no signing/proxy', () => {
    const { container } = render(
      <EmployeePortrait
        photoUrl="https://project.supabase.co/storage/v1/object/public/employee-photos/some-token/photo"
        employeeName="موظف تجريبي"
      />,
    )
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute(
      'src',
      'https://project.supabase.co/storage/v1/object/public/employee-photos/some-token/photo',
    )
  })
})
