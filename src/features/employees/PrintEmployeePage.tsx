import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeById } from './api'
import type { Employee } from '../../types/database'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import EmployeeCardRenderer from '../../components/card/EmployeeCardRenderer'
import { useSiteSettings } from '../settings/useSiteSettings'
import { CARD_PHYSICAL_WIDTH_MM, CARD_PHYSICAL_HEIGHT_MM } from '../../config/employeeCardLayout'

const CARD_PAGE_STYLE = `
  @media print {
    @page {
      size: ${CARD_PHYSICAL_WIDTH_MM}mm ${CARD_PHYSICAL_HEIGHT_MM}mm;
      margin: 0;
    }
  }
`

function PrintEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [isTemplateReady, setIsTemplateReady] = useState(false)
  // Tracks which template URLs isTemplateReady was last computed for, so a
  // change (new/replaced template) can be detected and reset during render
  // — adjusting state while rendering, rather than in an effect, avoids an
  // extra render pass (see react-hooks/set-state-in-effect).
  const [syncedTemplateUrls, setSyncedTemplateUrls] = useState<{
    front: string | null
    back: string | null
  }>({ front: null, back: null })
  const { employeeCardTemplateUrl, employeeCardBackTemplateUrl, employeeCardLayout } =
    useSiteSettings()

  if (
    employeeCardTemplateUrl !== syncedTemplateUrls.front ||
    employeeCardBackTemplateUrl !== syncedTemplateUrls.back
  ) {
    setSyncedTemplateUrls({ front: employeeCardTemplateUrl, back: employeeCardBackTemplateUrl })
    setIsTemplateReady(false)
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const data = await getEmployeeById(id!)
        if (!cancelled) setEmployee(data)
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل بيانات الموظف، يرجى تحديث الصفحة')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  // The export/print buttons must stay disabled until the template
  // (and back page, if any) have actually finished downloading — clicking
  // right when the page opens, before that, used to export/print with the
  // card's background missing since only the on-screen <img> was still
  // mid-load.
  useEffect(() => {
    if (!employeeCardTemplateUrl) return
    let cancelled = false

    const urls = [employeeCardTemplateUrl, employeeCardBackTemplateUrl].filter(
      (url): url is string => Boolean(url),
    )

    Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => resolve()
            img.src = url
          }),
      ),
    ).then(() => {
      if (!cancelled) setIsTemplateReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [employeeCardTemplateUrl, employeeCardBackTemplateUrl])

  async function handleExportPdf() {
    if (!employee || !employeeCardTemplateUrl || !isTemplateReady) return
    setIsExporting(true)
    setExportMessage(null)
    try {
      const { exportEmployeeCardPdf } = await import('../../lib/employeeCardPdf')
      const { warnings } = await exportEmployeeCardPdf({
        templateUrl: employeeCardTemplateUrl,
        backTemplateUrl: employeeCardBackTemplateUrl,
        employee,
        publicUrl: getEmployeePublicUrl(employee.public_token),
        layout: employeeCardLayout,
      })
      if (warnings.length > 0) {
        setExportMessage(`تم تنزيل الملف، لكن تعذر تضمين — ${warnings.join(' | ')}`)
      }
    } catch (error) {
      // Surfacing the real reason in the UI itself — not just the console —
      // matters here since non-technical admins can't easily open dev tools.
      const { errorMessage } = await import('../../lib/employeeCardPdf')
      setExportMessage(`تعذر تصدير الملف، يرجى المحاولة مرة أخرى (السبب: ${errorMessage(error)})`)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportImage() {
    if (!employee || !employeeCardTemplateUrl || !isTemplateReady) return
    setIsExporting(true)
    setExportMessage(null)
    try {
      const { exportEmployeeCardImage } = await import('../../lib/employeeCardPdf')
      const { warnings } = await exportEmployeeCardImage({
        templateUrl: employeeCardTemplateUrl,
        employee,
        publicUrl: getEmployeePublicUrl(employee.public_token),
        layout: employeeCardLayout,
      })
      if (warnings.length > 0) {
        setExportMessage(`تم تنزيل الصورة، لكن تعذر تضمين — ${warnings.join(' | ')}`)
      }
    } catch (error) {
      const { errorMessage } = await import('../../lib/employeeCardPdf')
      setExportMessage(`تعذر تصدير الصورة، يرجى المحاولة مرة أخرى (السبب: ${errorMessage(error)})`)
    } finally {
      setIsExporting(false)
    }
  }

  if (loadError) return <p className="p-8 text-expired">{loadError}</p>
  if (!employee) return <p className="p-8 text-text-secondary">جارٍ التحميل...</p>

  return (
    <div className="min-h-svh bg-surface-muted p-6 print:bg-white print:p-0">
      <style>{CARD_PAGE_STYLE}</style>

      <div className="mx-auto flex max-w-2xl justify-end gap-3 pb-4 print:hidden">
        <Link
          to={`/employees/${employee.id}`}
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          رجوع
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!isTemplateReady}
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted disabled:opacity-60"
        >
          طباعة
        </button>
        <button
          type="button"
          onClick={handleExportImage}
          disabled={!isTemplateReady || isExporting}
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted disabled:opacity-60"
        >
          {!isTemplateReady
            ? 'جارٍ تحميل القالب...'
            : isExporting
              ? 'جارٍ التصدير...'
              : 'تنزيل كصورة عالية الوضوح'}
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!isTemplateReady || isExporting}
          className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {!isTemplateReady ? 'جارٍ تحميل القالب...' : isExporting ? 'جارٍ التصدير...' : 'تنزيل PDF'}
        </button>
      </div>

      {exportMessage && (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-2xl rounded-field bg-red-50 px-4 py-3 text-sm text-expired print:hidden"
        >
          {exportMessage}
        </p>
      )}

      <div className="mx-auto max-w-2xl">
        {employeeCardTemplateUrl ? (
          <div className="flex flex-col items-center gap-6 print:block print:gap-0">
            <div className="shadow-md print:break-after-page print:shadow-none">
              <EmployeeCardRenderer
                templateUrl={employeeCardTemplateUrl}
                employee={employee}
                publicUrl={getEmployeePublicUrl(employee.public_token)}
                layout={employeeCardLayout}
              />
            </div>
            {employeeCardBackTemplateUrl && (
              <div className="shadow-md print:shadow-none">
                <img
                  src={employeeCardBackTemplateUrl}
                  alt="الصفحة الثانية (تعليمات)"
                  className="block h-auto w-full"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            لم يتم رفع قالب بطاقة بعد. يمكن للمشرف رفعه من الإعدادات ← قالب بطاقة الموظف.
          </p>
        )}
      </div>
    </div>
  )
}

export default PrintEmployeePage
