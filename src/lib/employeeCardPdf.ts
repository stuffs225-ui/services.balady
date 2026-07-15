import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import EmployeeCardRenderer from '../components/card/EmployeeCardRenderer'
import { getEmployeePhotoUrl } from '../features/employees/api'
import { generateQrDataUrl } from './qrcode'
import {
  TEMPLATE_NATURAL_WIDTH,
  TEMPLATE_NATURAL_HEIGHT,
  CARD_PHYSICAL_WIDTH_MM,
  CARD_PHYSICAL_HEIGHT_MM,
} from '../config/employeeCardLayout'
import type { Employee, EmployeeCardLayout } from '../types/database'

/**
 * Both the PDF and the standalone image download rasterize the card from
 * the same live overlay renderer at this resolution — the PDF is just the
 * same high-resolution PNGs (front + back) placed on two pages at the
 * card's physical size, nothing rendered differently between the two.
 */
const HIGH_RES_SCALE = 2

type ExportEmployeeCardPdfOptions = {
  templateUrl: string
  backTemplateUrl?: string | null
  employee: Employee
  publicUrl: string
  layout: EmployeeCardLayout
  fileName?: string
}

export type ExportEmployeeCardPdfResult = {
  /**
   * Human-readable, specific reasons any image (background, photo, or the
   * back-page template) couldn't be embedded — the PDF still downloads
   * with whatever succeeded, but the caller should surface these to the
   * admin instead of letting a partial export pass as silently correct.
   */
  warnings: string[]
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** "Health certificate - <certificate number>.<ext>", stripped of characters illegal in filenames. */
function cardFileName(employee: Employee, extension: 'pdf' | 'png'): string {
  const safeCertificateNumber = employee.certificate_number.replace(/[\\/:*?"<>|]/g, '').trim()
  return `Health certificate - ${safeCertificateNumber}.${extension}`
}

/**
 * Exports the employee card as a PDF at the exact physical card size
 * (CARD_PHYSICAL_WIDTH_MM x CARD_PHYSICAL_HEIGHT_MM), landscape, no margins,
 * background filling the page edge-to-edge — never scaled to A4 or padded.
 * Both pages are literally the same high-resolution PNGs produced by
 * exportEmployeeCardImage/the back-page renderer below, just placed on a
 * PDF page at the card's physical size — not a separately rendered, lower
 * quality path.
 */
export async function exportEmployeeCardPdf({
  templateUrl,
  backTemplateUrl,
  employee,
  publicUrl,
  layout,
  fileName,
}: ExportEmployeeCardPdfOptions): Promise<ExportEmployeeCardPdfResult> {
  const warnings: string[] = []
  const frontDataUrl = await renderCardFaceToDataUrl(
    templateUrl,
    employee,
    publicUrl,
    layout,
    warnings,
    HIGH_RES_SCALE,
  )

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM],
  })
  pdf.addImage(frontDataUrl, 'PNG', 0, 0, CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM)

  if (backTemplateUrl) {
    try {
      const backDataUrl = await imageUrlToCoverCanvasDataUrl(backTemplateUrl, HIGH_RES_SCALE)
      pdf.addPage([CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM], 'landscape')
      pdf.addImage(backDataUrl, 'PNG', 0, 0, CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM)
    } catch (error) {
      warnings.push(`الصفحة الثانية (التعليمات): ${errorMessage(error)}`)
    }
  }

  pdf.save(fileName || cardFileName(employee, 'pdf'))
  return { warnings }
}

export type ExportEmployeeCardImageResult = ExportEmployeeCardPdfResult

/**
 * Downloads the front face of the card as a standalone high-resolution PNG
 * (2x the card's normal 1004x638 export size), for admins who'd rather
 * convert it to a PDF themselves than rely on this app's PDF step.
 */
export async function exportEmployeeCardImage({
  templateUrl,
  employee,
  publicUrl,
  layout,
  fileName,
}: Omit<ExportEmployeeCardPdfOptions, 'backTemplateUrl'>): Promise<ExportEmployeeCardImageResult> {
  const warnings: string[] = []
  const dataUrl = await renderCardFaceToDataUrl(
    templateUrl,
    employee,
    publicUrl,
    layout,
    warnings,
    HIGH_RES_SCALE,
  )
  downloadDataUrl(dataUrl, fileName || cardFileName(employee, 'png'))
  return { warnings }
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function renderCardFaceToDataUrl(
  templateUrl: string,
  employee: Employee,
  publicUrl: string,
  layout: EmployeeCardLayout,
  warnings: string[],
  pixelRatio = 1,
): Promise<string> {
  // Resolve the photo/QR *before* mounting, and pass them in as fixed
  // values. Previously these were fetched by the renderer's own effects
  // after mount, racing a fixed setTimeout — on a slow photo fetch, the
  // <img> for the photo simply didn't exist yet when the DOM was captured,
  // so it silently dropped out of the exported card.
  const [photoUrl, qrDataUrl] = await Promise.all([
    getEmployeePhotoUrl(employee.employee_photo_path),
    generateQrDataUrl(publicUrl),
  ])

  // html-to-image clones the target node's own inline style, so hiding it
  // directly (position:fixed with an offset, opacity:0, ...) gets baked into
  // the capture and produces a blank image. Instead, clip it via an
  // ancestor wrapper and leave the captured node itself unstyled.
  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '0'
  wrapper.style.top = '0'
  wrapper.style.width = '0'
  wrapper.style.height = '0'
  wrapper.style.overflow = 'hidden'
  document.body.appendChild(wrapper)

  const container = document.createElement('div')
  container.style.width = `${TEMPLATE_NATURAL_WIDTH}px`
  container.style.height = `${TEMPLATE_NATURAL_HEIGHT}px`
  wrapper.appendChild(container)

  const root = createRoot(container)
  try {
    root.render(
      createElement(EmployeeCardRenderer, {
        templateUrl,
        employee,
        publicUrl,
        layout,
        exportMode: true,
        photoUrlOverride: photoUrl,
        qrDataUrlOverride: qrDataUrl,
      }),
    )

    // Let the initial paint settle, then wait for every image in the DOM
    // (now all present from the very first render) to finish loading.
    await new Promise((resolve) => setTimeout(resolve, 100))
    await waitForImages(container)

    // html-to-image embeds images by fetching them itself while building the
    // SVG snapshot; remote images (the template from Supabase storage, the
    // employee photo) can silently fail to embed there even though they
    // load fine as normal <img> elements. Sidestep that entirely by
    // replacing every remote image with an inlined data: URI first.
    await inlineRemoteImages(container, warnings)

    return await toPng(container, {
      width: TEMPLATE_NATURAL_WIDTH,
      height: TEMPLATE_NATURAL_HEIGHT,
      pixelRatio,
      cacheBust: true,
      // The card only ever uses the system font stack (Arial/Tahoma), so
      // there's nothing to embed — skip it to avoid html-to-image scanning
      // (and fetching) every stylesheet in the document, including unrelated
      // remote ones the rest of the app loads.
      skipFonts: true,
    })
  } finally {
    root.unmount()
    document.body.removeChild(wrapper)
  }
}

async function waitForImages(container: HTMLElement, timeoutMs = 4000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const imgs = Array.from(container.querySelectorAll('img'))
    if (imgs.every((img) => img.complete)) return
    await new Promise((resolve) => setTimeout(resolve, 60))
  }
}

/** Fetches a URL and returns its contents as a data: URI. */
async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`تعذر تحميل الصورة (${response.status})`)
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Draws an already-loaded <img> element onto a canvas and reads it back as a data: URI. */
function canvasDataUrlFromImageElement(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    throw new Error('تعذر قراءة بيانات الصورة')
  }
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Best-effort: inline a remote image as a data: URI. Prefers reading the
 * pixels straight off the element that already finished loading on screen —
 * Supabase Storage URLs have been observed to render fine as an <img> while
 * a fresh fetch() of the exact same URL fails (redirect/CORS quirks a plain
 * image load tolerates but fetch() does not). Falls back to a raw fetch if
 * that canvas readback fails for a genuinely CORS-tainted image. Throws
 * with both underlying reasons if neither path works, so the caller can
 * surface a specific diagnosis instead of a silent gap in the export.
 */
async function toDataUrlRobust(url: string, loadedElement: HTMLImageElement): Promise<string> {
  try {
    return canvasDataUrlFromImageElement(loadedElement)
  } catch (canvasError) {
    try {
      return await fetchAsDataUrl(url)
    } catch (fetchError) {
      throw new Error(
        `canvas: ${errorMessage(canvasError)} — fetch: ${errorMessage(fetchError)}`,
        { cause: fetchError },
      )
    }
  }
}

/** Replaces every non-data-URI <img> in the container with an inlined data: URI, in place. */
async function inlineRemoteImages(container: HTMLElement, warnings: string[]): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'))

  await Promise.all(
    imgs.map(async (img) => {
      if (img.src.startsWith('data:')) return
      const label = img.getAttribute('data-card-field') || img.alt || 'صورة'
      try {
        const dataUrl = await toDataUrlRobust(img.src, img)
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = dataUrl
        })
      } catch (error) {
        // Leave the original remote src — the export still proceeds, just
        // without that one image, rather than failing entirely. Report it
        // instead of swallowing it silently.
        warnings.push(`${label}: ${errorMessage(error)}`)
      }
    }),
  )
}

/**
 * Loads an image via a normal (CORS-friendly) <img> load first — the same
 * path that already renders these templates correctly on screen — and only
 * falls back to a raw fetch + data: URI if that fails outright.
 */
async function loadImageElementRobust(url: string): Promise<HTMLImageElement> {
  try {
    return await loadImageElement(url)
  } catch {
    const dataUrl = await fetchAsDataUrl(url)
    return await loadImageElement(dataUrl)
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('تعذر تحميل صورة قالب الصفحة الثانية'))
    image.src = url
  })
}

/** Loads a static image URL and draws it edge-to-edge (cover-fit) onto a fixed-size canvas. */
async function imageUrlToCoverCanvasDataUrl(url: string, scale = 1): Promise<string> {
  const image = await loadImageElementRobust(url)

  const canvas = document.createElement('canvas')
  canvas.width = TEMPLATE_NATURAL_WIDTH * scale
  canvas.height = TEMPLATE_NATURAL_HEIGHT * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('تعذر إنشاء لوحة الرسم')

  const coverScale = Math.max(canvas.width / image.width, canvas.height / image.height)
  const drawWidth = image.width * coverScale
  const drawHeight = image.height * coverScale
  const dx = (canvas.width - drawWidth) / 2
  const dy = (canvas.height - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)

  return canvas.toDataURL('image/png')
}
