import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getEmployeePhotoUrl } from '../../features/employees/api'
import { generateQrDataUrl } from '../../lib/qrcode'
import {
  TEMPLATE_NATURAL_WIDTH,
  TEMPLATE_NATURAL_HEIGHT,
  defaultEmployeeCardLayout,
  EMPLOYEE_CARD_NUMERIC_FIELDS,
} from '../../config/employeeCardLayout'
import type { Employee, EmployeeCardLayout, EmployeeCardTextBox } from '../../types/database'

type TextFieldKey = Exclude<keyof EmployeeCardLayout, 'photo' | 'qr'>
type MediaFieldKey = 'photo' | 'qr'
type FieldKey = keyof EmployeeCardLayout

const FONT_STACK = 'Arial, Tahoma, sans-serif'

function fieldValue(employee: Employee, field: TextFieldKey): string {
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
      return employee.issue_date_hijri || employee.issue_date_gregorian
    case 'expiryDate':
      return employee.expiry_date_hijri || employee.expiry_date_gregorian
    case 'educationProgramType':
      return employee.program_type || ''
    case 'educationProgramExpiry':
      return employee.program_completion_date_hijri || ''
    default:
      return ''
  }
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
                className="h-full w-full object-cover object-center"
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
            fontSize={scaledFontSize(box.fontSize)}
            isNumeric={isNumeric}
            isFullName={field === 'fullName'}
            calibrationMode={calibrationMode}
            selected={selectedField === field}
            onPointerDownMove={(event) => startDrag(field, 'move', event)}
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
      className={calibrationMode ? `absolute cursor-move ${selected ? 'outline outline-2 outline-brand-primary' : 'outline outline-1 outline-dashed outline-white/70'}` : 'absolute'}
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
}: TextOverlayBoxProps) {
  const justify = box.align === 'left' ? 'flex-start' : box.align === 'center' ? 'center' : 'flex-end'

  return (
    <div
      className={calibrationMode ? `absolute flex cursor-move items-center overflow-hidden ${selected ? 'outline outline-2 outline-brand-primary' : 'outline outline-1 outline-dashed outline-white/70'}` : 'absolute flex items-center overflow-hidden'}
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
            textAlign: 'right',
            unicodeBidi: isNumeric ? 'plaintext' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {value || '—'}
        </span>
      )}
    </div>
  )
}

function AutoFitText({ text, fontSize, color }: { text: string; fontSize: number; color: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [fittedSize, setFittedSize] = useState(fontSize)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    const span = spanRef.current
    if (!wrapper || !span) return

    let size = fontSize
    span.style.fontSize = `${size}px`
    let guard = 0
    while (span.scrollWidth > wrapper.clientWidth && size > fontSize * 0.4 && guard < 40) {
      size -= 1
      span.style.fontSize = `${size}px`
      guard += 1
    }
    setFittedSize(size)
  }, [text, fontSize])

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden" dir="rtl">
      <span
        ref={spanRef}
        className="block whitespace-nowrap"
        style={{
          fontFamily: FONT_STACK,
          fontSize: fittedSize,
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
