import { supabase, EMPLOYEE_PHOTOS_BUCKET } from '../../lib/supabase'
import type { PublicCertificate } from '../../types/database'

const PHOTO_SIGNED_URL_TTL_SECONDS = 60

export type PublicCertificateResult =
  | { kind: 'found'; certificate: PublicCertificate; photoUrl: string | null }
  | { kind: 'not-found' }
  | { kind: 'network-error' }

async function requestSignedPhotoUrl(token: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .createSignedUrl(`${token}/photo`, PHOTO_SIGNED_URL_TTL_SECONDS)
  return data?.signedUrl ?? null
}

// Fetches the photo's bytes ourselves and embeds them directly as a
// base64 data URL, instead of handing the page a remote URL for the
// browser to fetch/decode on its own. Some in-app mini-browsers
// (Snapchat, Instagram, etc.) are unreliable at loading a remote <img src>
// even when the exact same URL works fine elsewhere. A data URL has no
// follow-up network request at all — it's part of the page's own data by
// the time the page renders, so there's nothing left for the browser to
// get wrong.
async function fetchPhotoAsDataUrl(signedUrl: string): Promise<string | null> {
  try {
    const response = await fetch(signedUrl)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function fetchPublicCertificate(token: string): Promise<PublicCertificateResult> {
  // The photo's storage path is derived from the token alone, so it can be
  // requested in parallel with the RPC instead of waiting for it to resolve.
  const [{ data, error }, signedUrl] = await Promise.all([
    supabase.rpc('verify_certificate', { p_token: token }),
    requestSignedPhotoUrl(token),
  ])

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

  const photoUrl = raw.has_photo && signedUrl ? await fetchPhotoAsDataUrl(signedUrl) : null

  return { kind: 'found', certificate, photoUrl }
}
