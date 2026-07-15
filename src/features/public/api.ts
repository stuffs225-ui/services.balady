import { supabase } from '../../lib/supabase'
import type { PublicCertificate } from '../../types/database'

export type PublicCertificateResult =
  | { kind: 'found'; certificate: PublicCertificate; photoUrl: string | null; photoLoadFailed?: boolean }
  | { kind: 'not-found' }
  | { kind: 'network-error' }

function publicPhotoUrl(token: string, attempt: number): string {
  const base = `/api/public-employee-photo/${encodeURIComponent(token)}`
  return attempt === 0 ? base : `${base}?retry=${attempt}`
}

// Preloads and decodes the employee photo from our own same-origin proxy
// endpoint before the page ever leaves its loading state, retrying once on
// failure. Being same-origin (not a Supabase Storage signed URL) avoids the
// cross-origin decode()/CORS quirks that in-app browsers (Snapchat,
// Instagram, etc.) have with remote images.
async function loadEmployeePhoto(token: string): Promise<{ url: string | null; failed: boolean }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const src = publicPhotoUrl(token, attempt)
    try {
      const img = new Image()
      img.src = src
      await img.decode()
      return { url: src, failed: false }
    } catch {
      // fall through and retry once, then give up
    }
  }
  return { url: null, failed: true }
}

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

  if (!raw.has_photo) {
    return { kind: 'found', certificate, photoUrl: null }
  }

  const { url, failed } = await loadEmployeePhoto(token)
  return { kind: 'found', certificate, photoUrl: url, photoLoadFailed: failed }
}
