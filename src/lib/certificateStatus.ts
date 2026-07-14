import type { CertificateStatus } from '../types/database'

/**
 * Mirrors the status computation inside public.verify_certificate() so the
 * admin UI can show a consistent badge without an extra round trip.
 */
export function computeCertificateStatus(
  isActive: boolean,
  expiryDateGregorian: string,
  today: Date = new Date(),
): CertificateStatus {
  if (!isActive) return 'revoked'

  const expiry = new Date(expiryDateGregorian)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate())

  const diffDays = Math.floor(
    (expiryMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays < 0) return 'expired'
  return 'active'
}

export const CERTIFICATE_STATUS_LABELS: Record<CertificateStatus, string> = {
  active: 'سارية',
  expired: 'منتهية',
  revoked: 'ملغاة',
}
