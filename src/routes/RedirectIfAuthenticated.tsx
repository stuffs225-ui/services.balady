import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

function RedirectIfAuthenticated() {
  const { session, isLoading } = useAuth()

  if (isLoading) return null

  if (session) {
    return <Navigate to="/employees" replace />
  }

  return <Outlet />
}

export default RedirectIfAuthenticated
