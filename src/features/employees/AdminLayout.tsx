import { Link, Outlet } from 'react-router-dom'
import Logo from '../../components/brand/Logo'
import { siteIdentity } from '../../config/siteLinks'
import { useAuth } from '../../lib/useAuth'
import { useSiteSettings } from '../settings/useSiteSettings'

function AdminLayout() {
  const { signOut } = useAuth()
  const { logoUrl } = useSiteSettings()

  return (
    <div className="flex min-h-svh flex-col bg-surface-muted">
      <header className="border-b border-divider bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/employees" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteIdentity.nameAr} className="h-10 w-10 object-contain" />
            ) : (
              <Logo />
            )}
            <div>
              <p className="text-sm font-bold text-heading">{siteIdentity.nameAr}</p>
              <p className="text-xs font-medium text-brand-primary">
                ({siteIdentity.demoLabel})
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="rounded-button border border-divider px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-surface-muted"
            >
              الإعدادات
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-button border border-divider px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-surface-muted"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
