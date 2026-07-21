import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EmployeeCardOverridesPage from './EmployeeCardOverridesPage'
import { defaultEmployeeCardLayout } from '../../config/employeeCardLayout'
import type { Employee } from '../../types/database'

const mockGetEmployeeById = vi.fn()
const mockUpdateEmployeeCardOverrides = vi.fn()

vi.mock('./api', () => ({
  getEmployeeById: (...args: unknown[]) => mockGetEmployeeById(...args),
  updateEmployeeCardOverrides: (...args: unknown[]) => mockUpdateEmployeeCardOverrides(...args),
}))

vi.mock('../settings/useSiteSettings', () => ({
  useSiteSettings: () => ({
    employeeCardTemplateUrl: 'https://cdn.test/template.png',
    employeeCardLayout: defaultEmployeeCardLayout,
  }),
}))

// The renderer itself fetches photo/QR asynchronously and draws on the DOM
// in ways unrelated to this page's own logic — stubbed out so this test
// only exercises the override-editing panel.
vi.mock('../../components/card/EmployeeCardRenderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components/card/EmployeeCardRenderer')>()
  return {
    ...actual,
    default: () => <div data-testid="card-preview" />,
  }
})

const FAKE_EMPLOYEE: Employee = {
  id: 'emp-1',
  public_token: 'token-1',
  employee_name: 'موظف تجريبي',
  identity_number: '1234567890',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  profession: 'محاسب',
  authority_name: 'أمانة تجريبية',
  municipality_name: 'بلدية تجريبية',
  certificate_number: 'CERT-DEMO-0001',
  license_number: null,
  establishment_name: 'منشأة تجريبية',
  establishment_number: null,
  program_type: null,
  issue_date_hijri: null,
  issue_date_gregorian: '2026-06-30',
  expiry_date_hijri: null,
  expiry_date_gregorian: '2027-06-30',
  program_completion_date_hijri: null,
  employee_photo_path: null,
  employee_photo_crop: null,
  employee_card_overrides: null,
  visit_count: 0,
  reactivated_at: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employees/emp-1/card']}>
      <Routes>
        <Route path="/employees/:id/card" element={<EmployeeCardOverridesPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EmployeeCardOverridesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployeeById.mockResolvedValue(FAKE_EMPLOYEE)
  })

  it('saves a custom font size for a single field, scoped to this employee only', async () => {
    mockUpdateEmployeeCardOverrides.mockResolvedValue(undefined)
    renderPage()

    await screen.findByTestId('card-preview')

    const fontSizeInputs = screen.getAllByLabelText('حجم الخط')
    await userEvent.clear(fontSizeInputs[0])
    await userEvent.type(fontSizeInputs[0], '50')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    await waitFor(() =>
      expect(mockUpdateEmployeeCardOverrides).toHaveBeenCalledWith('emp-1', {
        fullName: { fontSize: 50 },
      }),
    )
  })

  it('saves a custom displayed text for a single field', async () => {
    mockUpdateEmployeeCardOverrides.mockResolvedValue(undefined)
    renderPage()

    await screen.findByTestId('card-preview')

    const textInputs = screen.getAllByLabelText('النص المعروض')
    await userEvent.type(textInputs[0], 'اسم بديل خاص بهذه البطاقة')

    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    await waitFor(() =>
      expect(mockUpdateEmployeeCardOverrides).toHaveBeenCalledWith('emp-1', {
        fullName: { text: 'اسم بديل خاص بهذه البطاقة' },
      }),
    )
  })

  it('resetting a field removes its override entirely and saves null when nothing else is overridden', async () => {
    mockGetEmployeeById.mockResolvedValue({
      ...FAKE_EMPLOYEE,
      employee_card_overrides: { fullName: { fontSize: 60 } },
    })
    mockUpdateEmployeeCardOverrides.mockResolvedValue(undefined)
    renderPage()

    await screen.findByTestId('card-preview')
    await userEvent.click(screen.getByRole('button', { name: 'إعادة تعيين' }))
    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    await waitFor(() =>
      expect(mockUpdateEmployeeCardOverrides).toHaveBeenCalledWith('emp-1', null),
    )
  })
})
