export type EmployeePhotoCrop = {
  /** Extra zoom beyond the natural object-fit:cover scale. 1 = no extra zoom. */
  scale: number
  /** Pan position, 0-100, same meaning as CSS object-position percentages. */
  offsetX: number
  offsetY: number
}

export const DEFAULT_PHOTO_CROP: EmployeePhotoCrop = { scale: 1, offsetX: 50, offsetY: 50 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Reads a possibly-partial/untrusted value (e.g. straight from the database) into a valid crop. */
export function normalizePhotoCrop(value: unknown): EmployeePhotoCrop {
  if (!value || typeof value !== 'object') return DEFAULT_PHOTO_CROP
  const source = value as Partial<EmployeePhotoCrop>
  const scale =
    typeof source.scale === 'number' && Number.isFinite(source.scale)
      ? clamp(source.scale, 1, 4)
      : DEFAULT_PHOTO_CROP.scale
  const offsetX =
    typeof source.offsetX === 'number' && Number.isFinite(source.offsetX)
      ? clamp(source.offsetX, 0, 100)
      : DEFAULT_PHOTO_CROP.offsetX
  const offsetY =
    typeof source.offsetY === 'number' && Number.isFinite(source.offsetY)
      ? clamp(source.offsetY, 0, 100)
      : DEFAULT_PHOTO_CROP.offsetY
  return { scale, offsetX, offsetY }
}

export type CoverDrawRect = { x: number; y: number; width: number; height: number }

/**
 * The single source of truth for placing a photo inside a box using
 * object-fit:cover semantics, adjusted by a saved crop's extra zoom and
 * pan. Used identically by every surface the employee photo appears on
 * (public page, card preview/calibration/print, PNG export) so they can
 * never visually disagree with each other. x/y are relative to the box's
 * own top-left corner and are typically negative (the scaled image
 * overflows the box on the sides that are panned away from) — the caller
 * must clip to the box when drawing.
 */
export function computeCoverDrawRect(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
  crop: EmployeePhotoCrop,
): CoverDrawRect {
  if (imageWidth <= 0 || imageHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { x: 0, y: 0, width: boxWidth, height: boxHeight }
  }

  const baseScale = Math.max(boxWidth / imageWidth, boxHeight / imageHeight)
  const scale = baseScale * Math.max(1, crop.scale)
  const width = imageWidth * scale
  const height = imageHeight * scale

  const slackX = Math.max(0, width - boxWidth)
  const slackY = Math.max(0, height - boxHeight)
  // The `|| 0` normalizes -0 to 0 (0 * -1 === -0 in JS), which otherwise
  // compares unequal to a plain 0 in strict equality checks.
  const x = -(slackX * (crop.offsetX / 100)) || 0
  const y = -(slackY * (crop.offsetY / 100)) || 0

  return { x, y, width, height }
}
