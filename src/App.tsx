import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './lib/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import RedirectIfAuthenticated from './routes/RedirectIfAuthenticated'
import LoginPage from './features/auth/LoginPage'
import AdminLayout from './features/employees/AdminLayout'
import EmployeeListPage from './features/employees/EmployeeListPage'
import NewEmployeePage from './features/employees/NewEmployeePage'
import EditEmployeePage from './features/employees/EditEmployeePage'
import EmployeeDetailsPage from './features/employees/EmployeeDetailsPage'
import PrintEmployeePage from './features/employees/PrintEmployeePage'
import PublicEmployeePage from './features/public/PublicEmployeePage'
import SettingsPage from './features/settings/SettingsPage'
import NotFoundPage from './features/misc/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/employees" replace />} />

        <Route path="/e/:token" element={<PublicEmployeePage />} />

        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/employees/new" element={<NewEmployeePage />} />
            <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
            <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/employees/:id/print" element={<PrintEmployeePage />} />
        </Route>

        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
