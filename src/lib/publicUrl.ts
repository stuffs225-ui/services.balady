/**
 * Builds the absolute public verification URL for an employee.
 *
 * Prefers VITE_APP_PUBLIC_URL when configured, but falls back to the current
 * browser origin so the copied link and the QR code are always a complete,
 * scannable URL even when the env var hasn't been set on the deployment.
 */
export function getEmployeePublicUrl(publicToken: string): string {
  const configured = import.meta.env.VITE_APP_PUBLIC_URL?.replace(/\/+$/, '')
  const origin = configured || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/e/${publicToken}`
}
