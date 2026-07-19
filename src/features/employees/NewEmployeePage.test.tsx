import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NewEmployeePage from './NewEmployeePage'

const mockGetEmployeeFieldSuggestions = vi.fn()

vi.mock('./api', () => ({
  createEmployee: vi.fn(),
  isUniqueViolation: vi.fn().mockReturnValue(false),
  getEmployeeFieldSuggestions: () => mockGetEmployeeFieldSuggestions(),
}))

describe('NewEmployeePage default authority/municipality', () => {
  it('pre-fills the authority and municipality fields with the usual values, still editable', () => {
    mockGetEmployeeFieldSuggestions.mockResolvedValue({
      authorityName: [],
      municipalityName: [],
      profession: [],
      programType: [],
      programCompletionDateHijri: [],
      licenseNumber: [],
      establishmentName: [],
      establishmentNumber: [],
    })

    render(
      <MemoryRouter>
        <NewEmployeePage />
      </MemoryRouter>,
    )

    expect((screen.getByLabelText('الأمانة') as HTMLInputElement).value).toBe('أمانة منطقة الرياض')
    expect((screen.getByLabelText('البلدية') as HTMLInputElement).value).toBe('بلدية السلي')
  })
})
