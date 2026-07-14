export function getEmployeePublicUrl(publicToken: string): string {
  const base = import.meta.env.VITE_APP_PUBLIC_URL?.replace(/\/+$/, '') || ''
  return `${base}/e/${publicToken}`
}
