import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEmployees, getEmployeePhotoUrl } from './api'
import type { Employee } from '../../types/database'
import { getEmployeeRegistrationDate, formatGregorianDate } from '../../lib/employeeRegistrationDate'
import { exportUnpaidEmployeesReportPdf } from '../../lib/unpaidEmployeesReportPdf'
import { errorMessage } from '../../lib/employeeCardPdf'

function UnpaidEmployeesReportPage() {
  const [unpaidEmployees, setUnpaidEmployees] = useState<Employee[] | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await listEmployees()
        if (cancelled) return
        const unpaid = data.filter((employee) => employee.is_unpaid)
        setUnpaidEmployees(unpaid)

        const entries = await Promise.all(
          unpaid.map(async (employee) => [
            employee.id,
            await getEmployeePhotoUrl(employee.employee_photo_path),
          ] as const),
        )
        if (!cancelled) setPhotoUrls(Object.fromEntries(entries))
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل التقرير، يرجى تحديث الصفحة')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleExportPdf() {
    if (!unpaidEmployees || unpaidEmployees.length === 0) return
    setExportError(null)
    setIsExporting(true)
    try {
      const { warnings } = await exportUnpaidEmployeesReportPdf(unpaidEmployees)
      if (warnings.length > 0) {
        setExportError(`تم إنشاء الملف، لكن تعذر تحميل بعض الصور: ${warnings.join('، ')}`)
      }
    } catch (error) {
      setExportError(`تعذر إنشاء ملف PDF: ${errorMessage(error)}`)
    } finally {
      setIsExporting(false)
    }
  }

  if (loadError) return <p className="text-expired">{loadError}</p>
  if (!unpaidEmployees) return <p className="text-text-secondary">جارٍ التحميل...</p>

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">تقرير الموظفين غير المدفوعين</h1>
        <div className="flex gap-3">
          <Link
            to="/employees"
            className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
          >
            رجوع
          </Link>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting || unpaidEmployees.length === 0}
            className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {isExporting ? 'جارٍ إنشاء الملف...' : 'تحميل تقرير PDF'}
          </button>
        </div>
      </div>

      {exportError && (
        <p className="mb-6 rounded-field bg-red-50 px-4 py-3 text-sm font-bold text-expired">{exportError}</p>
      )}

      {unpaidEmployees.length === 0 ? (
        <p className="text-text-secondary">لا يوجد موظفون غير مدفوعين حاليًا</p>
      ) : (
        <div className="overflow-hidden rounded-field border border-divider">
          <div className="flex items-center justify-between bg-surface-muted px-4 py-3">
            <p className="font-bold text-heading">العدد الإجمالي</p>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-text-secondary">
              {unpaidEmployees.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-divider text-text-secondary">
                  <th className="px-4 py-2 font-bold">#</th>
                  <th className="px-4 py-2 font-bold">الاسم</th>
                  <th className="px-4 py-2 font-bold">رقم الهوية</th>
                  <th className="px-4 py-2 font-bold">الجنسية</th>
                  <th className="px-4 py-2 font-bold">تاريخ التسجيل</th>
                  <th className="px-4 py-2 font-bold">الصورة</th>
                  <th className="px-4 py-2 font-bold">الملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {unpaidEmployees.map((employee, index) => (
                  <tr key={employee.id} className={index % 2 === 1 ? 'bg-surface-muted/50' : undefined}>
                    <td className="px-4 py-2 text-text-secondary">{index + 1}</td>
                    <td className="px-4 py-2 font-bold text-heading">{employee.employee_name}</td>
                    <td dir="ltr" className="px-4 py-2 text-right text-text-secondary">
                      {employee.identity_number}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">{employee.nationality}</td>
                    <td dir="ltr" className="px-4 py-2 text-right text-text-secondary">
                      {formatGregorianDate(new Date(getEmployeeRegistrationDate(employee)), {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2">
                      {photoUrls[employee.id] ? (
                        <img
                          src={photoUrls[employee.id]!}
                          alt={employee.employee_name}
                          className="h-10 w-10 rounded-field object-cover"
                        />
                      ) : (
                        <span className="text-xs text-text-secondary">لا صورة</span>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-2 text-text-secondary">{employee.unpaid_note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnpaidEmployeesReportPage
