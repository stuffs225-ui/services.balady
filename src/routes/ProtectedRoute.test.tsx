import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

const mockUseAuth = vi.fn()
vi.mock('../lib/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/employees" element={<div>Employees Page</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: false })
    renderProtected('/employees')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders the protected content for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: 'token' },
      isLoading: false,
    })
    renderProtected('/employees')
    expect(screen.getByText('Employees Page')).toBeInTheDocument()
  })

  it('shows a loading state while the session is being restored', () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: true })
    renderProtected('/employees')
    expect(screen.getByText('جارٍ التحميل...')).toBeInTheDocument()
  })
})
