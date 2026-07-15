import { useState } from 'react'
import { computeCoverDrawRect, normalizePhotoCrop, type EmployeePhotoCrop } from '../../lib/photoCrop'
import { refreshPhotoUrl } from '../../features/public/api'

const PORTRAIT_SIZE = 184

type EmployeePortraitProps = {
  photoUrl: string | null
  employeeName: string
  photoCrop?: EmployeePhotoCrop | null
  token?: string
}

function EmployeePortrait({ photoUrl, employeeName, photoCrop, token }: EmployeePortraitProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [syncedPhotoUrl, setSyncedPhotoUrl] = useState(photoUrl)
  const [displayUrl, setDisplayUrl] = useState(photoUrl)
  const [hasRetried, setHasRetried] = useState(false)

  // Adjust local display state during render (not in an effect) whenever a
  // freshly loaded certificate hands us a new photo URL.
  if (photoUrl !== syncedPhotoUrl) {
    setSyncedPhotoUrl(photoUrl)
    setDisplayUrl(photoUrl)
    setHasRetried(false)
  }

  const crop = normalizePhotoCrop(photoCrop)
  const rect = naturalSize
    ? computeCoverDrawRect(naturalSize.width, naturalSize.height, PORTRAIT_SIZE, PORTRAIT_SIZE, crop)
    : null

  async function handleError() {
    if (hasRetried || !token) {
      setDisplayUrl(null)
      return
    }
    setHasRetried(true)
    const fresh = await refreshPhotoUrl(token)
    setDisplayUrl(fresh)
  }

  return (
    <div className="mx-auto mt-[30px] mb-[28px] flex w-[184px] justify-center">
      {displayUrl ? (
        <div className="relative h-[184px] w-[184px] overflow-hidden">
          <img
            src={displayUrl}
            alt={employeeName}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
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
