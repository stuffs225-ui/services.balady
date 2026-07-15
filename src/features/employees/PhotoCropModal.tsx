import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PHOTO_CROP,
  computeCoverDrawRect,
  type EmployeePhotoCrop,
} from '../../lib/photoCrop'

/** Both the public page (184x184) and the card's photo box are near-square,
 * so a single square editor accurately previews either target. */
const EDITOR_SIZE = 260

type PhotoCropModalProps = {
  file: File
  initialCrop?: EmployeePhotoCrop
  onConfirm: (crop: EmployeePhotoCrop) => void
  onCancel: () => void
}

function PhotoCropModal({ file, initialCrop, onConfirm, onCancel }: PhotoCropModalProps) {
  // A lazy initializer computes this once at mount (this component is
  // always remounted fresh for a newly selected file, never handed a
  // replacement file prop while alive), so cleanup is the only thing the
  // effect below needs to do.
  const [objectUrl] = useState(() => URL.createObjectURL(file))
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [crop, setCrop] = useState<EmployeePhotoCrop>(initialCrop ?? DEFAULT_PHOTO_CROP)
  const dragState = useRef<{
    pointerId: number
    startX: number
    startY: number
    startCrop: EmployeePhotoCrop
  } | null>(null)

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  const rect = naturalSize
    ? computeCoverDrawRect(naturalSize.width, naturalSize.height, EDITOR_SIZE, EDITOR_SIZE, crop)
    : null

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current
    if (!drag || drag.pointerId !== event.pointerId || !naturalSize) return

    const startRect = computeCoverDrawRect(
      naturalSize.width,
      naturalSize.height,
      EDITOR_SIZE,
      EDITOR_SIZE,
      drag.startCrop,
    )
    const slackX = Math.max(0, startRect.width - EDITOR_SIZE)
    const slackY = Math.max(0, startRect.height - EDITOR_SIZE)

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    const offsetX = slackX === 0 ? drag.startCrop.offsetX : clamp(drag.startCrop.offsetX - (deltaX / slackX) * 100, 0, 100)
    const offsetY = slackY === 0 ? drag.startCrop.offsetY : clamp(drag.startCrop.offsetY - (deltaY / slackY) * 100, 0, 100)

    setCrop((prev) => ({ ...prev, offsetX, offsetY }))
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-field bg-surface p-6">
        <h2 className="mb-1 text-lg font-bold text-heading">معايرة الصورة الشخصية</h2>
        <p className="mb-4 text-sm text-text-secondary">
          اسحب الصورة لتحريكها وحدد التكبير، ستظهر بنفس الشكل بالصفحة العامة وبطاقة الموظف.
        </p>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-field bg-surface-muted"
          style={{ width: EDITOR_SIZE, height: EDITOR_SIZE, cursor: 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={objectUrl}
            alt="معاينة الصورة داخل أداة المعايرة"
            onLoad={handleImageLoad}
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={
              rect
                ? { left: rect.x, top: rect.y, width: rect.width, height: rect.height }
                : { opacity: 0 }
            }
          />
        </div>

        <label htmlFor="photoCropZoom" className="mt-4 mb-1 block text-sm font-bold text-text-primary">
          التكبير
        </label>
        <input
          id="photoCropZoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={crop.scale}
          onChange={(event) => setCrop((prev) => ({ ...prev, scale: Number(event.target.value) }))}
          className="w-full"
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => onConfirm(crop)}
            className="flex-1 rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover"
          >
            اعتماد الصورة
          </button>
        </div>
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export default PhotoCropModal
