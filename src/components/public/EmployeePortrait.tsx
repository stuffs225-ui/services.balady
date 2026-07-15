import { useState } from 'react'
import { computeCoverDrawRect, normalizePhotoCrop, type EmployeePhotoCrop } from '../../lib/photoCrop'

const PORTRAIT_SIZE = 184

type EmployeePortraitProps = {
  photoUrl: string | null
  employeeName: string
  photoCrop?: EmployeePhotoCrop | null
}

/**
 * Second, independent way to obtain the photo's bytes when the plain
 * <img src> load fails: fetch them ourselves and embed as a data: URI.
 * This is a genuinely different code path (our own network request +
 * FileReader, not the browser's own <img> loading/decoding pipeline), so
 * it can succeed on devices/apps where the first method doesn't, and vice
 * versa — different failure modes across iPhone/Samsung/in-app browsers.
 */
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
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

function EmployeePortrait({ photoUrl, employeeName, photoCrop }: EmployeePortraitProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [syncedPhotoUrl, setSyncedPhotoUrl] = useState(photoUrl)
  const [displaySrc, setDisplaySrc] = useState(photoUrl)
  const [triedFallback, setTriedFallback] = useState(false)
  const [failed, setFailed] = useState(false)

  // Adjust local display state during render (not in an effect) whenever a
  // freshly loaded certificate hands us a new photo URL — resets the
  // fallback attempt for the new employee.
  if (photoUrl !== syncedPhotoUrl) {
    setSyncedPhotoUrl(photoUrl)
    setDisplaySrc(photoUrl)
    setTriedFallback(false)
    setFailed(false)
  }

  const crop = normalizePhotoCrop(photoCrop)
  const rect = naturalSize
    ? computeCoverDrawRect(naturalSize.width, naturalSize.height, PORTRAIT_SIZE, PORTRAIT_SIZE, crop)
    : null

  async function handleError() {
    if (triedFallback || !photoUrl) {
      setFailed(true)
      return
    }
    setTriedFallback(true)
    const dataUrl = await fetchAsDataUrl(photoUrl)
    if (dataUrl) {
      setDisplaySrc(dataUrl)
    } else {
      setFailed(true)
    }
  }

  const showPhoto = Boolean(displaySrc) && !failed

  return (
    <div className="mx-auto mt-[30px] mb-[28px] flex w-[184px] justify-center">
      {showPhoto ? (
        <div className="relative h-[184px] w-[184px] overflow-hidden" aria-label={employeeName}>
          <img
            src={displaySrc!}
            alt=""
            onLoad={(event) => {
              const img = event.currentTarget
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
            }}
            onError={handleError}
            className="absolute select-none"
            style={rect ? { left: rect.x, top: rect.y, width: rect.width, height: rect.height } : { opacity: 0 }}
          />
        </div>
      ) : (
        <div className="flex h-[184px] w-[184px] items-center justify-center bg-surface-muted text-[15px] text-text-secondary">
          لا توجد صورة
        </div>
      )}
    </div>
  )
}

export default EmployeePortrait
