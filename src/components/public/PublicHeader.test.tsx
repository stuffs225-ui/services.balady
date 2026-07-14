import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicHeader from './PublicHeader'

vi.mock('../../features/settings/useSiteSettings', () => ({
  useSiteSettings: () => ({ logoUrl: null, navLinks: [] }),
}))

describe('PublicHeader', () => {
  it('places the menu button before the logo in the DOM (right side in RTL) and the logo last (left side)', () => {
    const { container } = render(<PublicHeader />)
    const row = container.querySelector('.flex.min-h-\\[78px\\]')!
    const children = Array.from(row.children)

    const menuButtonIndex = children.findIndex((el) => el.tagName === 'BUTTON')
    const logoBlockIndex = children.findIndex(
      (el) => el.tagName === 'DIV' && el.querySelector('svg, img'),
    )

    expect(menuButtonIndex).toBeLessThan(logoBlockIndex)
  })

  it('still exposes the accessible menu toggle button', () => {
    render(<PublicHeader />)
    expect(screen.getByRole('button', { name: 'فتح قائمة التنقل' })).toBeInTheDocument()
  })
})
