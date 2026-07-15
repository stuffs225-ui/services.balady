import { fieldValue, FONT_STACK, type TextFieldKey } from '../components/card/EmployeeCardRenderer'
import { getEmployeePhotoUrl } from '../features/employees/api'
import { generateQrDataUrl } from './qrcode'
import { computeCoverDrawRect, normalizePhotoCrop } from './photoCrop'
import {
  TEMPLATE_NATURAL_WIDTH,
  TEMPLATE_NATURAL_HEIGHT,
  EMPLOYEE_CARD_NUMERIC_FIELDS,
  EMPLOYEE_CARD_TEXT_FIELD_ORDER,
} from '../config/employeeCardLayout'
import type { Employee, EmployeeCardLayout, EmployeeCardTextBox } from '../types/database'

const NUMERIC_FIELD_SET = new Set<string>(EMPLOYEE_CARD_NUMERIC_FIELDS)

export type CardCanvasResult = {
  dataUrl: string
  warnings: string[]
}

/**
 * Renders the card's front face directly on a <canvas> — background,
 * template, calibrated photo, QR, then text, strictly in that order — as
 * a standalone, flattened, fully opaque PNG. This intentionally does not
 * reuse the DOM/html-to-image capture path the PDF export still uses:
 * that path can silently drop images depending on the browser/CORS
 * situation, and (with a transparent canvas background) has been the
 * source of PNGs that render solid black in the iPhone Photos app. A
 * canvas created with { alpha: false } can never contain a transparent
 * pixel, which structurally rules that out.
 */
export async function renderEmployeeCardToCanvas(
  templateUrl: string,
  employee: Employee,
  publicUrl: string,
  layout: EmployeeCardLayout,
  scale: number,
): Promise<CardCanvasResult> {
  const warnings: string[] = []

  const [templateImage, photoImage, qrImage] = await Promise.all([
    loadImageViaBlob(templateUrl),
    loadEmployeePhoto(employee.employee_photo_path),
    loadQrImage(publicUrl),
  ])

  const width = TEMPLATE_NATURAL_WIDTH * scale
  const height = TEMPLATE_NATURAL_HEIGHT * scale
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('تعذر إنشاء لوحة الرسم')

  // 1. Solid white background first — with an alpha:false context this is
  // strictly redundant (the canvas can't be transparent either way), but
  // it also gives a sane opaque base if any layer below fails to load.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // 2. Uploaded card-template image.
  if (templateImage) {
    drawCover(ctx, templateImage, 0, 0, width, height)
  } else {
    warnings.push('خلفية البطاقة: تعذر تحميل صورة القالب')
  }

  // 3. Calibrated employee photo.
  if (photoImage) {
    const box = layout.photo
    const boxX = (box.x / 100) * width
    const boxY = (box.y / 100) * height
    const boxWidth = (box.width / 100) * width
    const boxHeight = (box.height / 100) * height
    const crop = normalizePhotoCrop(employee.employee_photo_crop)
    const rect = computeCoverDrawRect(
      photoImage.naturalWidth,
      photoImage.naturalHeight,
      boxWidth,
      boxHeight,
      crop,
    )
    ctx.save()
    ctx.beginPath()
    ctx.rect(boxX, boxY, boxWidth, boxHeight)
    ctx.clip()
    ctx.drawImage(photoImage, boxX + rect.x, boxY + rect.y, rect.width, rect.height)
    ctx.restore()
  } else if (employee.employee_photo_path) {
    warnings.push('صورة الموظف: تعذر تحميلها')
  }

  // 4. QR code.
  if (qrImage) {
    const box = layout.qr
    const boxX = (box.x / 100) * width
    const boxY = (box.y / 100) * height
    const boxWidth = (box.width / 100) * width
    const boxHeight = (box.height / 100) * height
    drawContain(ctx, qrImage, boxX, boxY, boxWidth, boxHeight, 0.92)
  } else {
    warnings.push('رمز الاستجابة السريعة: تعذر إنشاؤه')
  }

  // 5. Text overlays.
  for (const field of EMPLOYEE_CARD_TEXT_FIELD_ORDER) {
    drawTextField(ctx, {
      value: fieldValue(employee, field),
      box: layout[field] as EmployeeCardTextBox,
      canvasWidth: width,
      canvasHeight: height,
      scale,
      isNumeric: NUMERIC_FIELD_SET.has(field),
      isFullName: field === ('fullName' as TextFieldKey),
    })
  }

  return { dataUrl: canvas.toDataURL('image/png'), warnings }
}

/**
 * Fetches an image as a Blob first and draws from a blob: object URL,
 * rather than setting an <img> src directly to a remote/Supabase URL —
 * once the bytes are already local, decoding and drawing them can never
 * taint the canvas or hit a CORS restriction, regardless of how the
 * remote server is configured.
 */
async function loadImageViaBlob(url: string): Promise<HTMLImageElement | null> {
  let objectUrl: string | null = null
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`تعذر تحميل الصورة (${response.status})`)
    const blob = await response.blob()
    objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    return image
  } catch {
    return null
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

async function loadEmployeePhoto(photoPath: string | null): Promise<HTMLImageElement | null> {
  if (!photoPath) return null
  const url = await getEmployeePhotoUrl(photoPath)
  if (!url) return null
  return loadImageViaBlob(url)
}

async function loadQrImage(publicUrl: string): Promise<HTMLImageElement | null> {
  try {
    const dataUrl = await generateQrDataUrl(publicUrl)
    const image = new Image()
    image.src = dataUrl
    await image.decode()
    return image
  } catch {
    return null
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const dx = x + (width - drawWidth) / 2
  const dy = y + (height - drawHeight) / 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)
  ctx.restore()
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fraction: number,
) {
  const targetWidth = width * fraction
  const targetHeight = height * fraction
  const scale = Math.min(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const dx = x + (width - drawWidth) / 2
  const dy = y + (height - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)
}

type DrawTextFieldOptions = {
  value: string
  box: EmployeeCardTextBox
  canvasWidth: number
  canvasHeight: number
  scale: number
  isNumeric: boolean
  isFullName: boolean
}

function drawTextField(ctx: CanvasRenderingContext2D, options: DrawTextFieldOptions) {
  const { value, box, canvasWidth, canvasHeight, scale, isNumeric, isFullName } = options
  const boxX = (box.x / 100) * canvasWidth
  const boxY = (box.y / 100) * canvasHeight
  const boxWidth = (box.width / 100) * canvasWidth
  const boxHeight = (box.height / 100) * canvasHeight
  const paddingRight = (isFullName ? 0 : 14) * scale
  const contentLeft = boxX
  const contentRight = boxX + boxWidth - paddingRight
  const contentWidth = Math.max(0, contentRight - contentLeft)
  const centerY = boxY + boxHeight / 2
  const displayValue = value || '—'

  ctx.save()
  ctx.textBaseline = 'middle'
  ctx.direction = isNumeric ? 'ltr' : 'rtl'
  ctx.fillStyle = box.color

  let text: string
  let anchorX: number
  let textAlign: CanvasTextAlign

  if (isFullName) {
    // The full-name field auto-fits and is always anchored physically
    // right — the on-screen/PDF renderer's AutoFitText wrapper always
    // spans 100% of the box width, so the outer box's align setting has
    // no visible effect there; only its own hardcoded right alignment
    // does. Mirrored here exactly, independent of box.align.
    const fontSize = fitFontSize(ctx, displayValue, box.fontSize * scale, contentWidth)
    ctx.font = `${fontSize}px ${FONT_STACK}`
    text = displayValue
    anchorX = contentRight
    textAlign = 'right'
  } else {
    ctx.font = `${box.fontSize * scale}px ${FONT_STACK}`
    text = truncateToWidth(ctx, displayValue, contentWidth)

    // Empirically confirmed against a real rendered page: under this
    // app's global rtl page direction, the on-screen/PDF renderer's CSS
    // `justify-content: flex-end` (used for align:'right', the default)
    // lands physically on the LEFT edge of the box, and `flex-start`
    // (align:'left') lands physically on the RIGHT — the reverse of what
    // the names suggest. Every saved box position was calibrated by eye
    // against that exact behavior, so this mirrors it precisely; using
    // the "obvious" mapping instead would visually diverge from the live
    // preview and PDF.
    if (box.align === 'left') {
      anchorX = contentRight
      textAlign = 'right'
    } else if (box.align === 'center') {
      anchorX = (contentLeft + contentRight) / 2
      textAlign = 'center'
    } else {
      anchorX = contentLeft
      textAlign = 'left'
    }
  }

  ctx.textAlign = textAlign
  ctx.fillText(text, anchorX, centerY)
  ctx.restore()
}

/** Mirrors AutoFitText's shrink-to-fit loop (same 1px steps, 40% floor, 40-iteration cap). */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  maxWidth: number,
): number {
  let size = fontSize
  ctx.font = `${size}px ${FONT_STACK}`
  let guard = 0
  while (ctx.measureText(text).width > maxWidth && size > fontSize * 0.4 && guard < 40) {
    size -= 1
    ctx.font = `${size}px ${FONT_STACK}`
    guard += 1
  }
  return size
}

/** Mirrors the DOM version's overflow:hidden + text-overflow:ellipsis for non-fullName fields. */
function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  const ellipsis = '…'
  let truncated = text
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated.length > 0 ? truncated + ellipsis : ellipsis
}
