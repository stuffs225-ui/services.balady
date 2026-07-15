import { supabase, EMPLOYEE_PHOTOS_BUCKET } from '../../lib/supabase'
import type { PublicCertificate } from '../../types/database'

// Long enough that a QR-scanner in-app preview (which can sit open for
// several minutes) never sees the URL expire mid-view.
const PHOTO_SIGNED_URL_TTL_SECONDS = 15 * 60

// Some in-app mini-browsers (Snapchat, Instagram, etc.) don't reliably
// support decoding an off-DOM image — it can hang or reject there even
// though the exact same URL renders fine as a normal <img>. Cap the wait
// so those browsers are never blocked on a preload step that will never
// finish.
const PHOTO_PRELOAD_TIMEOUT_MS = 3000

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

// Best-effort warm-up: decodes the image off-screen so well-behaved
// browsers can skip the loading flash. The URL is always returned
// regardless of whether the decode succeeds — a failed or timed-out
// decode must never hide a photo that the real <img> tag could still
// load normally.
async function preloadPhoto(url: string): Promise<string> {
  await Promise.race([
    (async () => {
      try {
        const img = new Image()
        img.src = url
        await img.decode()
      } catch {
        // Ignore — the real <img> tag still gets a normal chance to load it.
      }
    })(),
    new Promise<void>((resolve) => setTimeout(resolve, PHOTO_PRELOAD_TIMEOUT_MS)),
  ])
  return url
}

/** Requests a fresh signed URL and preloads it — used to retry after a failed/expired photo load. */
export async function refreshPhotoUrl(token: string): Promise<string | null> {
  const url = await requestSignedPhotoUrl(token)
  return url ? preloadPhoto(url) : null
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

  const photoUrl = raw.has_photo && signedUrl ? await preloadPhoto(signedUrl) : null

  return { kind: 'found', certificate, photoUrl }
}
