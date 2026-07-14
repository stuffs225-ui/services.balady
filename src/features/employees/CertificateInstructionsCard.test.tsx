import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CertificateInstructionsCard from './CertificateInstructionsCard'

describe('CertificateInstructionsCard', () => {
  it('renders the instructions heading and all four instruction lines', () => {
    render(<CertificateInstructionsCard />)
    expect(screen.getByText('تعليمات وإرشادات')).toBeInTheDocument()
    expect(screen.getByText(/تُجدد سنويًا/)).toBeInTheDocument()
    expect(screen.getByText(/فحص طبي عند عودته من الخارج/)).toBeInTheDocument()
    expect(screen.getByText(/لا تعتبر هذه الشهادة إثبات هوية/)).toBeInTheDocument()
  })

  it('shows the demo disclaimer so it survives printing', () => {
    render(<CertificateInstructionsCard />)
    expect(screen.getByText('نسخة تجريبية غير تابعة لأي جهة حكومية')).toBeInTheDocument()
  })
})
