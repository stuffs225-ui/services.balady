import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicTrustBanner from './PublicTrustBanner'

describe('PublicTrustBanner', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('keeps the digital verification panel closed by default', () => {
    render(<PublicTrustBanner />)
    expect(screen.queryByText(/يمكنك التحقق من صحة الشهادة/)).not.toBeInTheDocument()
  })

  it('opens the panel when the URL hash targets it', () => {
    window.location.hash = '#digital-verification'
    render(<PublicTrustBanner />)
    expect(screen.getByText(/يمكنك التحقق من صحة الشهادة/)).toBeInTheDocument()
  })

  it('always shows the demo disclaimer', () => {
    render(<PublicTrustBanner />)
    expect(screen.getByText('نسخة تجريبية غير تابعة لأي جهة حكومية')).toBeInTheDocument()
  })
})
