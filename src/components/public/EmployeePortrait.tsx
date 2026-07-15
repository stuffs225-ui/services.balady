import { useState } from 'react'
import { computeCoverDrawRect, normalizePhotoCrop, type EmployeePhotoCrop } from '../../lib/photoCrop'

const PORTRAIT_SIZE = 184

type EmployeePortraitProps = {
  photoUrl: string | null
  employeeName: string
  photoCrop?: EmployeePhotoCrop | null
  photoLoadFailed?: boolean
}

function EmployeePortrait({ photoUrl, employeeName, photoCrop, photoLoadFailed }: EmployeePortraitProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const crop = normalizePhotoCrop(photoCrop)
  const rect = naturalSize
    ? computeCoverDrawRect(naturalSize.width, naturalSize.height, PORTRAIT_SIZE, PORTRAIT_SIZE, crop)
    : null

  return (
    <div className="mx-auto mt-[30px] mb-[28px] flex w-[184px] justify-center">
      {photoUrl ? (
        <div className="relative h-[184px] w-[184px] overflow-hidden" aria-label={employeeName}>
          {/* alt="" — the name is already announced via aria-label above and shown elsewhere as text. */}
          <img
            src={photoUrl}
            alt=""
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            onLoad={(event) => {
              const img = event.currentTarget
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
            }}
            className="absolute select-none"
            style={rect ? { left: rect.x, top: rect.y, width: rect.width, height: rect.height } : { opacity: 0 }}
          />
        </div>
      ) : (
        <div className="flex h-[184px] w-[184px] items-center justify-center bg-surface-muted px-2 text-center text-[15px] text-text-secondary">
          {photoLoadFailed ? 'تعذر تحميل الصورة' : 'لا توجد صورة'}
        </div>
      )}
    </div>
  )
}

export default EmployeePortrait
