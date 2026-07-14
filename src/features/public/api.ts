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

  let photoUrl: string | null = null
  if (raw.has_photo) {
    const { data: signed } = await supabase.storage
      .from(EMPLOYEE_PHOTOS_BUCKET)
      .createSignedUrl(`${token}/photo`, 60)
    photoUrl = signed?.signedUrl ?? null
  }

  return { kind: 'found', certificate, photoUrl }
}
