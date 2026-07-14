/**
 * Masks all but the last 3 characters of an identity number, matching the
 * public verification page format, e.g. "2547109609" -> "*******609".
 * Mirrors the SQL implementation in public.mask_identity_number().
 */
export function maskIdentityNumber(identityNumber: string | null | undefined): string {
  if (!identityNumber) return ''
  if (identityNumber.length <= 3) return '*'.repeat(identityNumber.length)

  const visible = identityNumber.slice(-3)
  const hidden = '*'.repeat(identityNumber.length - 3)
  return `${hidden}${visible}`
}
