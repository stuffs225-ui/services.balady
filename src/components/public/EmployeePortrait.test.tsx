import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('shows a distinct error message when the photo failed to load, not the "no photo" placeholder', () => {
    render(<EmployeePortrait photoUrl={null} employeeName="موظف تجريبي" photoLoadFailed />)
    expect(screen.getByText('تعذر تحميل الصورة')).toBeInTheDocument()
    expect(screen.queryByText('لا توجد صورة')).toBeNull()
  })

  it('renders the same-origin proxy endpoint with the required loading attributes, not a remote/signed URL', () => {
    const { container } = render(
      <EmployeePortrait photoUrl="/api/public-employee-photo/some-token" employeeName="موظف تجريبي" />,
    )
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', '/api/public-employee-photo/some-token')
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('decoding', 'sync')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })
})
