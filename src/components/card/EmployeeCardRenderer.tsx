import { useEffect, useRef, useState } from 'react'
import { getEmployeePhotoUrl } from '../../features/employees/api'
import { generateQrDataUrl } from '../../lib/qrcode'
import { displayDateOnly } from '../../lib/dates'
import { computeCoverDrawRect, normalizePhotoCrop } from '../../lib/photoCrop'
import {
  TEMPLATE_NATURAL_WIDTH,
  TEMPLATE_NATURAL_HEIGHT,
  defaultEmployeeCardLayout,
  EMPLOYEE_CARD_NUMERIC_FIELDS,
} from '../../config/employeeCardLayout'
import type { Employee, EmployeeCardLayout, EmployeeCardTextBox } from '../../types/database'

export type TextFieldKey = Exclude<keyof EmployeeCardLayout, 'photo' | 'qr'>
type MediaFieldKey = 'photo' | 'qr'
type FieldKey = keyof EmployeeCardLayout

export const FONT_STACK = 'Arial, Tahoma, sans-serif'

// Single deterministic date formatter — used everywhere the card is
// rendered or exported (preview, calibration, print, image/PDF export all
// share this one component), so a date is never independently formatted
// (or mis-formatted) in more than one place. Exported so the canvas-based
// PNG export (employeeCardPdf.ts) reads employee data through the exact
// same mapping instead of a second, independently-maintained copy.
export function fieldValue(employee: Employee, field: TextFieldKey): string {
  const overrideText = employee.employee_card_overrides?.[field]?.text
  if (overrideText) return overrideText

  switch (field) {
    case 'fullName':
      return employee.employee_name
    case 'identityNumber':
      return employee.identity_number
    case 'nationality':
      return employee.nationality
    case 'certificateNumber':
      return employee.certificate_number
    case 'profession':
      return employee.profession
    case 'issueDate':
      return employee.issue_date_hijri || displayDateOnly(employee.issue_date_gregorian)
    case 'expiryDate':
      return employee.expiry_date_hijri || displayDateOnly(employee.expiry_date_gregorian)
    case 'educationProgramType':
      return employee.program_type || ''
    case 'educationProgramExpiry':
      return employee.program_completion_date_hijri || ''
    default:
      return ''
  }
}

/**
 * A field's configured font size, unless this specific employee has a
 * per-card override for it — layered on top of the global calibration so a
 * single special-case card can be adjusted without touching the shared
 * layout used by every other card.
 */
export function fieldFontSize(
  employee: Employee,
  field: TextFieldKey,
  layout: EmployeeCardLayout,
): number {
  return employee.employee_card_overrides?.[field]?.fontSize ?? layout[field].fontSize
}

const NUMERIC_FIELD_SET = new Set<string>(EMPLOYEE_CARD_NUMERIC_FIELDS)

type EmployeeCardRendererProps = {
  templateUrl: string
  employee: Employee
  publicUrl: string
  layout?: EmployeeCardLayout
  calibrationMode?: boolean
  selectedField?: FieldKey | null
  onSelectField?: (field: FieldKey) => void
  onLayoutChange?: (layout: EmployeeCardLayout) => void
  /** Used for PDF export: forces the exact 1004x638 canvas, background filled edge-to-edge. */
  exportMode?: boolean
  /**
   * Pre-resolved photo/QR values, used by the PDF export so the snapshot
   * never races the internal async fetch below (which only starts after
   * mount and, if it hasn't resolved yet when the DOM is captured, silently
   * leaves the photo out of the export).
   */
  photoUrlOverride?: string | null
  qrDataUrlOverride?: string | null
}

/**
 * Overlays an employee's data on top of an admin-uploaded card background
 * image. The background is never redrawn or recreated — only the dynamic
 * values (name, photo, QR, dates, ...) are positioned on top of it, at the
 * percentage coordinates in `layout`.
 */
function EmployeeCardRenderer({
  templateUrl,
  employee,
  publicUrl,
  layout = defaultEmployeeCardLayout,
  calibrationMode = false,
  selectedField = null,
  onSelectField,
  onLayoutChange,
  exportMode = false,
  photoUrlOverride,
  qrDataUrlOverride,
}: EmployeeCardRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderedWidth, setRenderedWidth] = useState(TEMPLATE_NATURAL_WIDTH)
  const [photoUrl, setPhotoUrl] = useState<string | null>(photoUrlOverride ?? null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(qrDataUrlOverride ?? null)
  const [photoNaturalSize, setPhotoNaturalSize] = useState<{ width: number; height: number } | null>(
    null,
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setRenderedWidth(width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (photoUrlOverride !== undefined) return
    let cancelled = false
    getEmployeePhotoUrl(employee.employee_photo_path).then((url) => {
      if (!cancelled) setPhotoUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [employee.employee_photo_path, photoUrlOverride])

  useEffect(() => {
    if (qrDataUrlOverride !== undefined) return
    let cancelled = false
    generateQrDataUrl(publicUrl).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [publicUrl, qrDataUrlOverride])

  function scaledFontSize(configuredFontSize: number): number {
    return (configuredFontSize * renderedWidth) / TEMPLATE_NATURAL_WIDTH
  }

  function updateField(field: FieldKey, patch: Partial<EmployeeCardLayout[FieldKey]>) {
    if (!onLayoutChange) return
    onLayoutChange({ ...layout, [field]: { ...layout[field], ...patch } })
  }

  function startDrag(field: FieldKey, mode: 'move' | 'resize', event: React.PointerEvent) {
    if (!calibrationMode || !onLayoutChange) return
    event.preventDefault()
    event.stopPropagation()
    onSelectField?.(field)

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const startBox = { ...layout[field] }
    const startX = event.clientX
    const startY = event.clientY

    function handleMove(moveEvent: PointerEvent) {
      const deltaXPct = ((moveEvent.clientX - startX) / rect.width) * 100
      const deltaYPct = ((moveEvent.clientY - startY) / rect.height) * 100

      if (mode === 'move') {
        const x = clamp(startBox.x + deltaXPct, 0, 100 - startBox.width)
        const y = clamp(startBox.y + deltaYPct, 0, 100 - startBox.height)
        updateField(field, { x, y })
      } else {
        const width = clamp(startBox.width + deltaXPct, 3, 100 - startBox.x)
        const height = clamp(startBox.height + deltaYPct, 3, 100 - startBox.y)
        updateField(field, { width, height })
      }
    }

    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const renderedHeight = (renderedWidth * TEMPLATE_NATURAL_HEIGHT) / TEMPLATE_NATURAL_WIDTH
  const photoBox = layout.photo
  const photoBoxPixelWidth = (photoBox.width / 100) * renderedWidth
  const photoBoxPixelHeight = (photoBox.height / 100) * renderedHeight
  const photoCrop = normalizePhotoCrop(employee.employee_photo_crop)
  const photoDrawRect = photoNaturalSize
    ? computeCoverDrawRect(
        photoNaturalSize.width,
        photoNaturalSize.height,
        photoBoxPixelWidth,
        photoBoxPixelHeight,
        photoCrop,
      )
    : null

  const textFields: TextFieldKey[] = [
    'fullName',
    'identityNumber',
    'nationality',
    'certificateNumber',
    'profession',
    'issueDate',
    'expiryDate',
    'educationProgramType',
    'educationProgramExpiry',
  ]
  const mediaFields: MediaFieldKey[] = ['photo', 'qr']

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={
        exportMode
          ? { width: TEMPLATE_NATURAL_WIDTH, height: TEMPLATE_NATURAL_HEIGHT }
          : { width: '100%' }
      }
    >
      <img
        src={templateUrl}
        alt=""
        crossOrigin="anonymous"
        data-card-field="خلفية البطاقة"
        className={
          exportMode ? 'block h-full w-full object-cover' : 'block h-auto w-full'
        }
        draggable={false}
      />

      {mediaFields.map((field) => (
        <MediaOverlayBox
          key={field}
          field={field}
          box={layout[field]}
          calibrationMode={calibrationMode}
          selected={selectedField === field}
          onPointerDownMove={(event) => startDrag(field, 'move', event)}
          onPointerDownResize={(event) => startDrag(field, 'resize', event)}
        >
          {field === 'photo' ? (
            photoUrl ? (
              <img
                src={photoUrl}
                alt={employee.employee_name}
                crossOrigin="anonymous"
                data-card-field="صورة الموظف"
                onLoad={(event) => {
                  const img = event.currentTarget
                  setPhotoNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
                }}
                className="absolute select-none"
                style={
                  photoDrawRect
                    ? {
                        left: photoDrawRect.x,
                        top: photoDrawRect.y,
                        width: photoDrawRect.width,
                        height: photoDrawRect.height,
                      }
                    : { opacity: 0 }
                }
                draggable={false}
              />
            ) : null
          ) : qrDataUrl ? (
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={qrDataUrl}
                alt="رمز الاستجابة السريعة"
                className="h-[92%] w-[92%] object-contain"
                draggable={false}
              />
            </div>
          ) : null}
        </MediaOverlayBox>
      ))}

      {textFields.map((field) => {
        const box = layout[field] as EmployeeCardTextBox
        const value = fieldValue(employee, field)
        const isNumeric = NUMERIC_FIELD_SET.has(field)

        return (
          <TextOverlayBox
            key={field}
            field={field}
            box={box}
            value={value}
            fontSize={scaledFontSize(fieldFontSize(employee, field, layout))}
            isNumeric={isNumeric}
            isFullName={field === 'fullName'}
            calibrationMode={calibrationMode}
            selected={selectedField === field}
            onPointerDownMove={(event) => startDrag(field, 'move', event)}
            onPointerDownResize={(event) => startDrag(field, 'resize', event)}
          />
        )
      })}
    </div>
  )
}

type MediaOverlayBoxProps = {
  field: MediaFieldKey
  box: { x: number; y: number; width: number; height: number }
  calibrationMode: boolean
  selected: boolean
  onPointerDownMove: (event: React.PointerEvent) => void
  onPointerDownResize: (event: React.PointerEvent) => void
  children: React.ReactNode
}

function MediaOverlayBox({
  box,
  calibrationMode,
  selected,
  onPointerDownMove,
  onPointerDownResize,
  children,
}: MediaOverlayBoxProps) {
  return (
    <div
      className={calibrationMode ? `absolute overflow-hidden cursor-move ${selected ? 'outline outline-2 outline-brand-primary' : 'outline outline-1 outline-dashed outline-white/70'}` : 'absolute overflow-hidden'}
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }}
      onPointerDown={calibrationMode ? onPointerDownMove : undefined}
    >
      {children}
      {calibrationMode && (
        <div
          className="absolute -right-1 -bottom-1 h-3 w-3 cursor-nwse-resize rounded-sm bg-brand-primary"
          onPointerDown={onPointerDownResize}
        />
      )}
    </div>
  )
}

type TextOverlayBoxProps = {
  field: FieldKey
  box: EmployeeCardTextBox
  value: string
  fontSize: number
  isNumeric: boolean
  isFullName: boolean
  calibrationMode: boolean
  selected: boolean
  onPointerDownMove: (event: React.PointerEvent) => void
  onPointerDownResize: (event: React.PointerEvent) => void
}

function TextOverlayBox({
  box,
  value,
  fontSize,
  isNumeric,
  isFullName,
  calibrationMode,
  selected,
  onPointerDownMove,
  onPointerDownResize,
}: TextOverlayBoxProps) {
  const justify = box.align === 'left' ? 'flex-start' : box.align === 'center' ? 'center' : 'flex-end'
  // The full-name field is never clipped — it always renders at its exact
  // configured font size, so a long name is left free to extend past the
  // box rather than being cut off. Every other field keeps the usual
  // overflow-hidden + ellipsis truncation.
  const overflowClass = isFullName ? '' : ' overflow-hidden'

  return (
    <div
      className={
        (calibrationMode
          ? `absolute flex cursor-move items-center${overflowClass} ${selected ? 'outline outline-2 outline-brand-primary' : 'outline outline-1 outline-dashed outline-white/70'}`
          : `absolute flex items-center${overflowClass}`) + (isFullName ? ' z-10' : '')
      }
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        justifyContent: justify,
        paddingRight: isFullName ? 0 : 14,
      }}
      onPointerDown={calibrationMode ? onPointerDownMove : undefined}
    >
      {isFullName ? (
        <AutoFitText text={value} fontSize={fontSize} color={box.color} />
      ) : (
        <span
          dir={isNumeric ? 'ltr' : 'rtl'}
          className="whitespace-nowrap text-ellipsis"
          style={{
            fontFamily: FONT_STACK,
            fontSize,
            fontWeight: 400,
            color: box.color,
            direction: isNumeric ? 'ltr' : 'rtl',
            textAlign: 'right',
            // isolate (not plaintext) keeps digit/date sequences fully
            // insulated from the surrounding rtl bidi context, instead of
            // guessing a base direction from the string's first strong
            // character — plaintext has no strong character to anchor on
            // in a pure digit/date string, which is how a value like
            // 2037-07-15 could end up visually reordered.
            unicodeBidi: isNumeric ? 'isolate' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {value || '—'}
        </span>
      )}
      {calibrationMode && (
        <div
          className="absolute -right-1 -bottom-1 h-3 w-3 cursor-nwse-resize rounded-sm bg-brand-primary"
          onPointerDown={onPointerDownResize}
        />
      )}
    </div>
  )
}

// Always renders at exactly the configured font size, regardless of the
// text's length — deliberately does not shrink to fit the box. If a long
// name doesn't fit, the admin adjusts the font size or the box's width
// from the calibration settings themselves rather than the renderer
// silently shrinking it.
function AutoFitText({ text, fontSize, color }: { text: string; fontSize: number; color: string }) {
  return (
    <div className="w-full" dir="rtl">
      <span
        className="block whitespace-nowrap"
        style={{
          fontFamily: FONT_STACK,
          fontSize,
          fontWeight: 400,
          color,
          textAlign: 'right',
        }}
      >
        {text}
      </span>
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export default EmployeeCardRenderer
