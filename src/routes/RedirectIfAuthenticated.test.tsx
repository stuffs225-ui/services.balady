import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RedirectIfAuthenticated from './RedirectIfAuthenticated'

const mockUseAuth = vi.fn()
vi.mock('../lib/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<div>Login Page</div>} />
        </Route>
        <Route path="/employees" element={<div>Employees Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RedirectIfAuthenticated', () => {
  it('redirects authenticated users away from /login', () => {
    mockUseAuth.mockReturnValue({ session: { access_token: 'token' }, isLoading: false })
    renderGuarded()
    expect(screen.getByText('Employees Page')).toBeInTheDocument()
  })

  it('renders /login for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: false })
    renderGuarded()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
