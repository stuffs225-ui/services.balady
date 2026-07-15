import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmployeePortrait from './EmployeePortrait'

describe('EmployeePortrait', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  describe('dual fallback when the direct <img> load fails', () => {
    beforeEach(() => {
      // jsdom's FileReader works against a real Blob, so a fetch mock that
      // returns a real Blob exercises the same code path production uses.
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake-bytes'], { type: 'image/jpeg' })),
        }),
      )
    })

    it('switches to a self-fetched data: URL — same box, same position — when the direct link fails to load', async () => {
      const { container } = render(
        <EmployeePortrait photoUrl="https://cdn.test/broken.jpg" employeeName="موظف تجريبي" />,
      )
      const img = container.querySelector('img')!
      fireEvent.error(img)

      await waitFor(() => {
        expect(container.querySelector('img')!.src).toMatch(/^data:/)
      })
      // Still the exact same 184x184 box, not a different layout.
      const box = container.querySelector('img')!.parentElement!
      expect(box.className).toContain('h-[184px]')
      expect(box.className).toContain('w-[184px]')
    })

    it('shows the placeholder only after both the direct load and the fallback fetch fail', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

      const { container } = render(
        <EmployeePortrait photoUrl="https://cdn.test/broken.jpg" employeeName="موظف تجريبي" />,
      )
      const img = container.querySelector('img')!
      fireEvent.error(img)

      await waitFor(() => {
        expect(screen.getByText('لا توجد صورة')).toBeInTheDocument()
      })
    })
  })
})
