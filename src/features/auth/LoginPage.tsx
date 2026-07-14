import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/useAuth'
import Logo from '../../components/brand/Logo'
import { useSiteSettings } from '../settings/useSiteSettings'

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { logoUrl, headerTitleText, headerSubtitleText } = useSiteSettings()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate('/employees', { replace: true })
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-surface-muted px-6 py-12">
      <div className="w-full max-w-sm rounded-md border border-divider bg-surface p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={headerTitleText} className="h-14 w-14 object-contain" />
          ) : (
            <Logo />
          )}
          <div>
            <h1 className="text-lg font-bold text-heading">{headerTitleText}</h1>
            <p className="mt-1 text-sm font-medium text-brand-primary">{headerSubtitleText}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-text-primary">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-text-primary">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-field bg-red-50 px-3 py-2 text-sm text-expired">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-button bg-brand-primary px-4 py-3 font-bold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default LoginPage
