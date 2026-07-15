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
  const { employeeCardTemplateUrl, employeeCardBackTemplateUrl, employeeCardLayout } =
    useSiteSettings()

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

  async function handleExportPdf() {
    if (!employee || !employeeCardTemplateUrl) return
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
    } catch {
      setExportMessage('تعذر تصدير الملف، يرجى المحاولة مرة أخرى')
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
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          طباعة
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!employeeCardTemplateUrl || isExporting}
          className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {isExporting ? 'جارٍ التصدير...' : 'تنزيل PDF'}
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
