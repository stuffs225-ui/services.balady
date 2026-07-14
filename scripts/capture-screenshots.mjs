// One-off visual verification helper (not part of the app bundle).
// Mocks the Supabase RPC/storage responses and captures the public
// employee page at the viewports required by the visual spec.
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:4173'
const OUTPUT_DIR = path.join(__dirname, '..', 'visual-output')
const AVATAR_SVG = readFileSync(path.join(__dirname, 'fixtures/demo-avatar.svg'))

const DEMO_CERTIFICATE = {
  employee_name: 'أحمد محمد التجريبي',
  identity_number_masked: '*******609',
  gender: 'ذكر',
  nationality: 'الجنسية التجريبية',
  profession: 'محاسب',
  authority_name: 'أمانة المنطقة التجريبية',
  municipality_name: 'بلدية النموذج',
  certificate_number: 'CERT-DEMO-2026-001',
  license_number: 'LIC-DEMO-001',
  establishment_name: 'شركة النموذج التجريبية',
  establishment_number: 'EST-DEMO-001',
  program_type: 'منشآت الغذاء',
  issue_date_hijri: '1448/01/15',
  issue_date_gregorian: '2026-06-30',
  expiry_date_hijri: '1449/01/15',
  expiry_date_gregorian: '2027-06-30',
  program_completion_date_hijri: '1451/01/15',
  has_photo: true,
  status: 'active',
}

const VIEWPORTS = [
  { name: '360', width: 360, height: 900 },
  { name: '390', width: 390, height: 900 },
  { name: '430', width: 430, height: 900 },
  { name: '768', width: 768, height: 1000 },
  { name: 'desktop', width: 1280, height: 1000 },
]

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const context = await browser.newContext()

  await context.route('**/rest/v1/rpc/verify_certificate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([DEMO_CERTIFICATE]) }),
  )
  await context.route('**/storage/v1/object/sign/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ signedURL: '/mock-photo.svg' }),
    }),
  )
  await context.route('**/mock-photo.svg', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: AVATAR_SVG }),
  )

  const page = await context.newPage()

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`${BASE_URL}/e/demo-token-visual-check`, { waitUntil: 'networkidle' })
    await page.waitForSelector('text=أحمد محمد التجريبي')
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${viewport.name}.png`),
      fullPage: true,
    })
    console.log(`Captured verify-${viewport.name}.png`)
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
