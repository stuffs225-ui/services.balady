import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PHOTO_CROP,
  computeCoverDrawRect,
  type EmployeePhotoCrop,
} from '../../lib/photoCrop'

/** Both the public page (184x184) and the card's photo box are near-square,
 * so a single square editor accurately previews either target. */
const EDITOR_SIZE = 260
const MIN_ZOOM = 1
const MAX_ZOOM = 6

type Point = { x: number; y: number }

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

type PhotoCropModalProps = {
  file: File
  initialCrop?: EmployeePhotoCrop
  onConfirm: (crop: EmployeePhotoCrop, photoFile: File) => void
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
  const [removeBackground, setRemoveBackground] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)

  // Tracks every pointer currently down on the editor (mouse drag = one
  // pointer; touch pinch-to-zoom = two), keyed by pointerId.
  const activePointers = useRef<Map<number, Point>>(new Map())
  // Snapshot of the crop and gesture reference point(s) taken at the start
  // of the current gesture (or re-taken whenever the pointer count
  // changes), so pan/pinch deltas are always measured from a stable
  // baseline instead of drifting frame to frame.
  const gestureStart = useRef<{
    crop: EmployeePhotoCrop
    singlePoint: Point | null
    pinchDistance: number | null
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

  function captureGestureStart(currentCrop: EmployeePhotoCrop) {
    const points = Array.from(activePointers.current.values())
    if (points.length >= 2) {
      gestureStart.current = {
        crop: currentCrop,
        singlePoint: null,
        pinchDistance: distance(points[0], points[1]),
      }
    } else if (points.length === 1) {
      gestureStart.current = { crop: currentCrop, singlePoint: points[0], pinchDistance: null }
    } else {
      gestureStart.current = null
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    captureGestureStart(crop)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!activePointers.current.has(event.pointerId) || !naturalSize) return
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const start = gestureStart.current
    if (!start) return

    if (start.pinchDistance !== null && activePointers.current.size >= 2) {
      // Two fingers: pinch to zoom, anchored on the distance between them
      // at gesture start — squeezing together zooms out, spreading apart
      // zooms in, from wherever the pinch began.
      const points = Array.from(activePointers.current.values()).slice(0, 2)
      const currentDistance = distance(points[0], points[1])
      if (start.pinchDistance > 0) {
        const scale = clamp(
          start.crop.scale * (currentDistance / start.pinchDistance),
          MIN_ZOOM,
          MAX_ZOOM,
        )
        setCrop((prev) => ({ ...prev, scale }))
      }
      return
    }

    if (start.singlePoint) {
      // One finger/mouse: pan, same as before.
      const startRect = computeCoverDrawRect(
        naturalSize.width,
        naturalSize.height,
        EDITOR_SIZE,
        EDITOR_SIZE,
        start.crop,
      )
      const slackX = Math.max(0, startRect.width - EDITOR_SIZE)
      const slackY = Math.max(0, startRect.height - EDITOR_SIZE)

      const deltaX = event.clientX - start.singlePoint.x
      const deltaY = event.clientY - start.singlePoint.y

      const offsetX =
        slackX === 0 ? start.crop.offsetX : clamp(start.crop.offsetX - (deltaX / slackX) * 100, 0, 100)
      const offsetY =
        slackY === 0 ? start.crop.offsetY : clamp(start.crop.offsetY - (deltaY / slackY) * 100, 0, 100)

      setCrop((prev) => ({ ...prev, offsetX, offsetY }))
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId)
    // Re-anchor the gesture (e.g. lifting one finger after a pinch drops
    // back to a one-finger pan) so the next move doesn't jump.
    captureGestureStart(crop)
  }

  async function handleConfirmClick() {
    if (!removeBackground) {
      onConfirm(crop, file)
      return
    }

    setIsProcessing(true)
    setProcessError(null)
    try {
      const { removeBackground: runRemoval } = await import('@imgly/background-removal')
      const resultBlob = await runRemoval(file, { model: 'isnet_fp16' })
      const processedFile = new File([resultBlob], 'employee-photo-no-bg.png', { type: 'image/png' })
      onConfirm(crop, processedFile)
    } catch {
      setProcessError('تعذرت إزالة الخلفية، يرجى المحاولة مرة أخرى أو إلغاء تحديد الخيار')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-field bg-surface p-6">
        <h2 className="mb-1 text-lg font-bold text-heading">معايرة الصورة الشخصية</h2>
        <p className="mb-4 text-sm text-text-secondary">
          اسحب الصورة لتحريكها، وقرّب إصبعيك أو باعد بينهما للتكبير والتصغير — ستظهر بنفس الشكل
          بالصفحة العامة وبطاقة الموظف.
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

          {/* Rule-of-thirds guide lines — purely visual, helps center/balance
              the face while dragging or pinching; never part of the saved photo. */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/3 h-full w-px bg-white/70" />
            <div className="absolute top-0 left-2/3 h-full w-px bg-white/70" />
            <div className="absolute top-1/3 left-0 h-px w-full bg-white/70" />
            <div className="absolute top-2/3 left-0 h-px w-full bg-white/70" />
          </div>
        </div>

        <label htmlFor="photoCropZoom" className="mt-4 mb-1 block text-sm font-bold text-text-primary">
          التكبير
        </label>
        <input
          id="photoCropZoom"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={crop.scale}
          onChange={(event) => setCrop((prev) => ({ ...prev, scale: Number(event.target.value) }))}
          className="w-full"
        />

        <label className="mt-4 flex items-center gap-2 text-sm font-bold text-text-primary">
          <input
            type="checkbox"
            checked={removeBackground}
            onChange={(event) => setRemoveBackground(event.target.checked)}
            disabled={isProcessing}
          />
          إزالة خلفية الصورة
        </label>
        <p className="mt-1 text-xs text-text-secondary">
          تتم المعالجة داخل المتصفح فقط، تستغرق بضع ثوانٍ. تظهر الصورة بعدها بخلفية شفافة فوق تصميم
          الكرت والصفحة العامة.
        </p>

        {isProcessing && (
          <p className="mt-2 text-sm text-brand-primary">جارٍ إزالة الخلفية...</p>
        )}
        {processError && !isProcessing && (
          <p className="mt-2 text-sm text-expired">{processError}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted disabled:opacity-60"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isProcessing}
            className="flex-1 rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {isProcessing ? 'جارٍ المعالجة...' : 'اعتماد الصورة'}
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
