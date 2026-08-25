import { jsPDF } from 'jspdf'
import { FONT_STACK } from '../components/card/EmployeeCardRenderer'
import { loadImageViaBlob } from './employeeCardCanvas'
import { savePdfDirectly, errorMessage } from './employeeCardPdf'
import { getEmployeePhotoUrl } from '../features/employees/api'
import { getEmployeeRegistrationDate, formatGregorianDate } from './employeeRegistrationDate'
import { todayDateOnly } from './dates'
import type { Employee } from '../types/database'

// A4 portrait at roughly 150dpi — crisp enough to print, small enough to
// stay fast to render and keep the resulting PDF a reasonable size.
const PAGE_WIDTH = 1240
const PAGE_HEIGHT = 1754
const MARGIN = 50
const TABLE_TOP = 200
const HEADER_ROW_HEIGHT = 60
const DATA_ROW_HEIGHT = 120
const PHOTO_SIZE = 90

const FIXED_COLUMN_WIDTHS = {
  index: 60,
  name: 230,
  identity: 160,
  nationality: 140,
  registrationDate: 150,
  photo: 130,
}

const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const COLUMN_WIDTHS = {
  ...FIXED_COLUMN_WIDTHS,
  // Fills whatever width remains after every fixed-width column.
  note: CONTENT_WIDTH - Object.values(FIXED_COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0),
}

/** Exported for tests — how many employee rows fit on one A4 page before starting a new one. */
export const ROWS_PER_PAGE = Math.max(
  1,
  Math.floor((PAGE_HEIGHT - TABLE_TOP - HEADER_ROW_HEIGHT - MARGIN) / DATA_ROW_HEIGHT),
)

type ColumnKey = keyof typeof COLUMN_WIDTHS
/** Right to left, matching the app's RTL reading order — "index" is the rightmost column. */
const COLUMN_ORDER: ColumnKey[] = ['index', 'name', 'identity', 'nationality', 'registrationDate', 'photo', 'note']
const COLUMN_LABELS: Record<ColumnKey, string> = {
  index: '#',
  name: 'اسم الموظف',
  identity: 'رقم الهوية',
  nationality: 'الجنسية',
  registrationDate: 'تاريخ التسجيل',
  photo: 'صورة الموظف',
  note: 'الملاحظة',
}

/** x-range (right edge first, since the layout is built right-to-left) for each column. */
function columnRects(): Record<ColumnKey, { right: number; left: number }> {
  const rects = {} as Record<ColumnKey, { right: number; left: number }>
  let right = PAGE_WIDTH - MARGIN
  for (const key of COLUMN_ORDER) {
    const left = right - COLUMN_WIDTHS[key]
    rects[key] = { right, left }
    right = left
  }
  return rects
}

export type UnpaidReportResult = {
  /** Employees whose photo couldn't be loaded — the row still prints, just without a thumbnail. */
  warnings: string[]
}

/**
 * Generates and downloads a PDF report of unpaid employees: numbered rows
 * with name, identity number, nationality, registration date, a photo
 * thumbnail, and the private note, paginated across as many A4 pages as
 * needed. Drawn directly on a <canvas> (same technique as the employee
 * card's fast export path) rather than via jsPDF's own text rendering,
 * since jsPDF cannot shape Arabic script — a canvas's fillText can,
 * exactly as the browser renders it on screen.
 */
export async function exportUnpaidEmployeesReportPdf(employees: Employee[]): Promise<UnpaidReportResult> {
  const warnings: string[] = []

  const photos = await Promise.all(
    employees.map(async (employee) => {
      if (!employee.employee_photo_path) return null
      try {
        const url = await getEmployeePhotoUrl(employee.employee_photo_path)
        if (!url) return null
        const image = await loadImageViaBlob(url)
        if (!image) throw new Error('تعذر تحميل الصورة')
        return image
      } catch (error) {
        warnings.push(`${employee.employee_name}: ${errorMessage(error)}`)
        return null
      }
    }),
  )

  const pageCount = Math.max(1, Math.ceil(employees.length / ROWS_PER_PAGE))
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const start = pageIndex * ROWS_PER_PAGE
    const pageRows = employees.slice(start, start + ROWS_PER_PAGE)
    const dataUrl = renderReportPage(pageRows, photos.slice(start, start + ROWS_PER_PAGE), {
      startIndex: start,
      pageNumber: pageIndex + 1,
      pageCount,
      totalCount: employees.length,
    })

    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm)
  }

  await savePdfDirectly(pdf, `تقرير الموظفين غير المدفوعين - ${todayDateOnly()}.pdf`)
  return { warnings }
}

type PageMeta = { startIndex: number; pageNumber: number; pageCount: number; totalCount: number }

function renderReportPage(
  rows: Employee[],
  photos: (HTMLImageElement | null)[],
  meta: PageMeta,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('تعذر إنشاء لوحة الرسم')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)

  drawHeader(ctx, meta)
  drawTableHeader(ctx)

  const rects = columnRects()
  rows.forEach((employee, rowIndex) => {
    const rowTop = TABLE_TOP + HEADER_ROW_HEIGHT + rowIndex * DATA_ROW_HEIGHT
    drawDataRow(ctx, rects, rowTop, meta.startIndex + rowIndex + 1, employee, photos[rowIndex])
  })

  return canvas.toDataURL('image/png')
}

function drawHeader(ctx: CanvasRenderingContext2D, meta: PageMeta) {
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  ctx.fillStyle = '#4a5157'
  ctx.font = `bold 40px ${FONT_STACK}`
  ctx.fillText('تقرير الموظفين غير المدفوعين', PAGE_WIDTH / 2, 90)

  ctx.fillStyle = '#535960'
  ctx.font = `24px ${FONT_STACK}`
  ctx.fillText(
    `تاريخ الإصدار: ${formatGregorianDate(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' })} · إجمالي: ${meta.totalCount} · الصفحة ${meta.pageNumber} من ${meta.pageCount}`,
    PAGE_WIDTH / 2,
    140,
  )
  ctx.restore()
}

function drawTableHeader(ctx: CanvasRenderingContext2D) {
  const rects = columnRects()
  ctx.save()
  ctx.fillStyle = '#f6f6f6'
  ctx.fillRect(MARGIN, TABLE_TOP, CONTENT_WIDTH, HEADER_ROW_HEIGHT)

  ctx.direction = 'rtl'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#4a5157'
  ctx.font = `bold 24px ${FONT_STACK}`

  for (const key of COLUMN_ORDER) {
    const { left, right } = rects[key]
    ctx.fillText(COLUMN_LABELS[key], (left + right) / 2, TABLE_TOP + HEADER_ROW_HEIGHT / 2, right - left - 10)
  }
  ctx.restore()
}

function drawDataRow(
  ctx: CanvasRenderingContext2D,
  rects: Record<ColumnKey, { right: number; left: number }>,
  rowTop: number,
  rowNumber: number,
  employee: Employee,
  photo: HTMLImageElement | null,
) {
  if (rowNumber % 2 === 0) {
    ctx.save()
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(MARGIN, rowTop, CONTENT_WIDTH, DATA_ROW_HEIGHT)
    ctx.restore()
  }

  ctx.save()
  ctx.strokeStyle = '#d9dde1'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(MARGIN, rowTop + DATA_ROW_HEIGHT)
  ctx.lineTo(MARGIN + CONTENT_WIDTH, rowTop + DATA_ROW_HEIGHT)
  ctx.stroke()
  ctx.restore()

  const centerY = rowTop + DATA_ROW_HEIGHT / 2
  const cellPadding = 12

  drawCellText(ctx, String(rowNumber), rects.index, centerY, { direction: 'ltr' })
  drawCellText(ctx, employee.employee_name, rects.name, centerY, { direction: 'rtl', bold: true })
  drawCellText(ctx, employee.identity_number, rects.identity, centerY, { direction: 'ltr' })
  drawCellText(ctx, employee.nationality, rects.nationality, centerY, { direction: 'rtl' })
  drawCellText(
    ctx,
    formatGregorianDate(new Date(getEmployeeRegistrationDate(employee)), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    rects.registrationDate,
    centerY,
    { direction: 'ltr' },
  )

  const photoBox = rects.photo
  const photoX = (photoBox.left + photoBox.right) / 2 - PHOTO_SIZE / 2
  const photoY = centerY - PHOTO_SIZE / 2
  if (photo) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX, photoY, PHOTO_SIZE, PHOTO_SIZE)
    ctx.clip()
    const scale = Math.max(PHOTO_SIZE / photo.naturalWidth, PHOTO_SIZE / photo.naturalHeight)
    const drawWidth = photo.naturalWidth * scale
    const drawHeight = photo.naturalHeight * scale
    ctx.drawImage(
      photo,
      photoX + (PHOTO_SIZE - drawWidth) / 2,
      photoY + (PHOTO_SIZE - drawHeight) / 2,
      drawWidth,
      drawHeight,
    )
    ctx.restore()
  } else {
    ctx.save()
    ctx.strokeStyle = '#d9dde1'
    ctx.strokeRect(photoX, photoY, PHOTO_SIZE, PHOTO_SIZE)
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#8a8f95'
    ctx.font = `18px ${FONT_STACK}`
    ctx.fillText('لا صورة', photoX + PHOTO_SIZE / 2, photoY + PHOTO_SIZE / 2)
    ctx.restore()
  }

  // Note: wrapped across up to 3 lines instead of one anchored line like
  // the other cells, since it's the one field expected to run long.
  const noteBox = rects.note
  const noteMaxWidth = noteBox.right - noteBox.left - cellPadding * 2
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#535960'
  ctx.font = `22px ${FONT_STACK}`
  const noteText = employee.unpaid_note?.trim() || '—'
  const lines = wrapText(ctx, noteText, noteMaxWidth, 3)
  const lineHeight = 28
  const blockHeight = lines.length * lineHeight
  let lineY = centerY - blockHeight / 2 + lineHeight / 2
  for (const line of lines) {
    ctx.fillText(line, noteBox.right - cellPadding, lineY, noteMaxWidth)
    lineY += lineHeight
  }
  ctx.restore()
}

type DrawCellOptions = { direction: CanvasDirection; bold?: boolean }

function drawCellText(
  ctx: CanvasRenderingContext2D,
  value: string,
  rect: { right: number; left: number },
  centerY: number,
  options: DrawCellOptions,
) {
  const cellPadding = 12
  const maxWidth = rect.right - rect.left - cellPadding * 2

  ctx.save()
  ctx.direction = options.direction
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#111111'
  ctx.font = `${options.bold ? 'bold ' : ''}24px ${FONT_STACK}`

  const displayValue = value || '—'
  const text = truncateToWidth(ctx, displayValue, maxWidth)

  if (options.direction === 'rtl') {
    ctx.textAlign = 'right'
    ctx.fillText(text, rect.right - cellPadding, centerY, maxWidth)
  } else {
    ctx.textAlign = 'center'
    ctx.fillText(text, (rect.left + rect.right) / 2, centerY, maxWidth)
  }
  ctx.restore()
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  const ellipsis = '…'
  let truncated = text
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated.length > 0 ? truncated + ellipsis : ellipsis
}

/** Greedy word-wrap into at most maxLines, ellipsizing the last line if the text still doesn't fit. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines

  const truncated = lines.slice(0, maxLines)
  truncated[maxLines - 1] = ellipsizeLine(ctx, truncated[maxLines - 1], maxWidth)
  return truncated
}

/** Like truncateToWidth, but always appends the ellipsis (the caller already knows more text follows). */
function ellipsizeLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const ellipsis = '…'
  let truncated = text
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated.length > 0 ? truncated + ellipsis : ellipsis
}
