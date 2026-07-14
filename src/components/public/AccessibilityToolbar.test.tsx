import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccessibilityToolbar from './AccessibilityToolbar'

function renderToolbar(accessibilityLinkHref: string | null = null) {
  const onToggleLargeText = vi.fn()
  render(
    <AccessibilityToolbar
      datePreference={null}
      onDatePreferenceChange={() => {}}
      isLargeText={false}
      onToggleLargeText={onToggleLargeText}
      accessibilityLinkHref={accessibilityLinkHref}
    />,
  )
  return { onToggleLargeText }
}

describe('AccessibilityToolbar', () => {
  it('renders the large-text toggle button when no link is configured', () => {
    const { onToggleLargeText } = renderToolbar(null)
    const button = screen.getByRole('button', { name: /أدوات سهولة الوصول/ })
    expect(button.tagName).toBe('BUTTON')
    return userEvent.click(button).then(() => {
      expect(onToggleLargeText).toHaveBeenCalledOnce()
    })
  })

  it('renders a real link when accessibility_link_href is configured', () => {
    renderToolbar('https://example.test/accessibility')
    const link = screen.getByRole('link', { name: /أدوات سهولة الوصول/ })
    expect(link).toHaveAttribute('href', 'https://example.test/accessibility')
  })

  it('opens the settings menu with the print action available', async () => {
    renderToolbar(null)
    await userEvent.click(screen.getByRole('button', { name: 'الإعدادات' }))
    expect(screen.getByRole('button', { name: 'الطباعة' })).toBeInTheDocument()
  })
})
