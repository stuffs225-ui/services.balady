import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicHeader from './PublicHeader'

vi.mock('../../features/settings/useSiteSettings', () => ({
  useSiteSettings: () => ({
    logoUrl: null,
    navLinks: [],
    logoSize: 96,
  }),
}))

describe('PublicHeader', () => {
  it('places the menu button before the logo in the DOM (right side in RTL) and the logo last (left side)', () => {
    const { container } = render(<PublicHeader />)
    const row = container.querySelector('.flex.min-h-\\[78px\\]')!
    const children = Array.from(row.children)

    const menuButtonIndex = children.findIndex((el) => el.tagName === 'BUTTON')
    const logoIndex = children.findIndex(
      (el) => el.tagName.toLowerCase() === 'svg' || el.tagName === 'IMG',
    )

    expect(menuButtonIndex).toBeLessThan(logoIndex)
  })

  it('still exposes the accessible menu toggle button', () => {
    render(<PublicHeader />)
    expect(screen.getByRole('button', { name: 'فتح قائمة التنقل' })).toBeInTheDocument()
  })

  it('renders the logo at the admin-configured size', () => {
    const { container } = render(<PublicHeader />)
    const logo = container.querySelector('svg[aria-label="شعار النظام التجريبي"]')
    expect(logo).toHaveAttribute('width', '96')
    expect(logo).toHaveAttribute('height', '96')
  })

  it('no longer renders any header title/subtitle text', () => {
    render(<PublicHeader />)
    expect(screen.queryByText('نظام الشهادات الصحية')).not.toBeInTheDocument()
    expect(screen.queryByText('(نسخة تجريبية)')).not.toBeInTheDocument()
  })
})
