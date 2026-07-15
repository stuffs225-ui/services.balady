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

type ExportEmployeeCardPdfOptions = {
  templateUrl: string
  backTemplateUrl?: string | null
  employee: Employee
  publicUrl: string
  layout: EmployeeCardLayout
  fileName?: string
}

/**
 * Exports the employee card as a PDF at the exact physical card size
 * (CARD_PHYSICAL_WIDTH_MM x CARD_PHYSICAL_HEIGHT_MM), landscape, no margins,
 * background filling the page edge-to-edge — never scaled to A4 or padded.
 * The front face is rasterized from the live overlay renderer at the fixed
 * 1004x638 canvas (~300 DPI at this physical size); the back face (if a
 * static instructions template is configured) is added as-is.
 */
export async function exportEmployeeCardPdf({
  templateUrl,
  backTemplateUrl,
  employee,
  publicUrl,
  layout,
  fileName,
}: ExportEmployeeCardPdfOptions): Promise<void> {
  const frontDataUrl = await renderCardFaceToDataUrl(templateUrl, employee, publicUrl, layout)

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM],
  })
  pdf.addImage(frontDataUrl, 'PNG', 0, 0, CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM)

  if (backTemplateUrl) {
    const backDataUrl = await imageUrlToCoverCanvasDataUrl(backTemplateUrl)
    pdf.addPage([CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM], 'landscape')
    pdf.addImage(backDataUrl, 'PNG', 0, 0, CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM)
  }

  pdf.save(fileName || `employee-card-${employee.public_token}.pdf`)
}

async function renderCardFaceToDataUrl(
  templateUrl: string,
  employee: Employee,
  publicUrl: string,
  layout: EmployeeCardLayout,
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
    await inlineRemoteImages(container)

    return await toPng(container, {
      width: TEMPLATE_NATURAL_WIDTH,
      height: TEMPLATE_NATURAL_HEIGHT,
      pixelRatio: 1,
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
 * that canvas readback fails for a genuinely CORS-tainted image.
 */
async function toDataUrlRobust(url: string, loadedElement: HTMLImageElement): Promise<string> {
  try {
    return canvasDataUrlFromImageElement(loadedElement)
  } catch {
    return await fetchAsDataUrl(url)
  }
}

/** Replaces every non-data-URI <img> in the container with an inlined data: URI, in place. */
async function inlineRemoteImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'))

  await Promise.all(
    imgs.map(async (img) => {
      if (img.src.startsWith('data:')) return
      try {
        const dataUrl = await toDataUrlRobust(img.src, img)
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = dataUrl
        })
      } catch {
        // Leave the original remote src — the export will still proceed,
        // just without that one image, rather than failing entirely.
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
async function imageUrlToCoverCanvasDataUrl(url: string): Promise<string> {
  const image = await loadImageElementRobust(url)

  const canvas = document.createElement('canvas')
  canvas.width = TEMPLATE_NATURAL_WIDTH
  canvas.height = TEMPLATE_NATURAL_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('تعذر إنشاء لوحة الرسم')

  const scale = Math.max(canvas.width / image.width, canvas.height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const dx = (canvas.width - drawWidth) / 2
  const dy = (canvas.height - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)

  return canvas.toDataURL('image/png')
}
