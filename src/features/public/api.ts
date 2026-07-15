import { supabase, EMPLOYEE_PHOTOS_BUCKET } from '../../lib/supabase'
import type { PublicCertificate } from '../../types/database'

export type PublicCertificateResult =
  | { kind: 'found'; certificate: PublicCertificate; photoUrl: string | null }
  | { kind: 'not-found' }
  | { kind: 'network-error' }

export async function fetchPublicCertificate(token: string): Promise<PublicCertificateResult> {
  const { data, error } = await supabase.rpc('verify_certificate', { p_token: token })

  if (error) {
    return { kind: 'network-error' }
  }

  const raw = data?.[0]
  if (!raw) {
    return { kind: 'not-found' }
  }

  // Defensive coercion in case an older, not-yet-migrated RPC still returns
  // the retired "expiring" status.
  const certificate: PublicCertificate = {
    ...raw,
    status: (raw.status as string) === 'expiring' ? 'active' : raw.status,
  }

  // Same mechanism as the header logo/branding assets: a plain, permanent
  // public Storage URL — no signing, no expiry, no server proxy. This is a
  // synchronous local URL construction, not a network call.
  const photoUrl = raw.has_photo
    ? supabase.storage.from(EMPLOYEE_PHOTOS_BUCKET).getPublicUrl(`${token}/photo`).data.publicUrl
    : null

  return { kind: 'found', certificate, photoUrl }
}
