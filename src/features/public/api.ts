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

  const certificate = data?.[0]
  if (!certificate) {
    return { kind: 'not-found' }
  }

  let photoUrl: string | null = null
  if (certificate.has_photo) {
    const { data: signed } = await supabase.storage
      .from(EMPLOYEE_PHOTOS_BUCKET)
      .createSignedUrl(`${token}/photo`, 60)
    photoUrl = signed?.signedUrl ?? null
  }

  return { kind: 'found', certificate, photoUrl }
}
