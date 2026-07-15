import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEmployees, deactivateEmployee, deleteEmployee, getEmployeePhotoUrl } from './api'
import type { Employee } from '../../types/database'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import { generateQrDataUrl, downloadQrDataUrl } from '../../lib/qrcode'
import { computeCertificateStatus, CERTIFICATE_STATUS_LABELS } from '../../lib/certificateStatus'

const PAGE_SIZE = 10

function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({})
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    const handle = setTimeout(async () => {
      setStatus('loading')
      try {
        const data = await listEmployees({ query })
        if (cancelled) return
        setEmployees(data)
        setPage(1)
        setStatus('ready')

        const entries = await Promise.all(
          data.map(async (employee) => [
            employee.id,
            await getEmployeePhotoUrl(employee.employee_photo_path),
          ] as const),
        )
        if (!cancelled) setPhotoUrls(Object.fromEntries(entries))
      } catch {
        if (!cancelled) setStatus('error')
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query])

  const paginated = useMemo(
    () => employees.slice(0, page * PAGE_SIZE),
    [employees, page],
  )
  const hasMore = paginated.length < employees.length

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(getEmployeePublicUrl(token))
  }

  async function handleDownloadQr(employee: Employee) {
    const dataUrl = await generateQrDataUrl(getEmployeePublicUrl(employee.public_token))
    downloadQrDataUrl(dataUrl, `qr-${employee.certificate_number}.png`)
  }

  async function handleDeactivate(id: string) {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا الموظف؟')) return
    await deactivateEmployee(id)
    setEmployees((prev) =>
      prev.map((employee) => (employee.id === id ? { ...employee, is_active: false } : employee)),
    )
  }

  async function handleDelete(employee: Employee) {
    if (
      !confirm(
        `هل أنت متأكد من حذف بيانات "${employee.employee_name}" نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه — ستُحذف كل بياناته وصورته بشكل كامل ونهائي ولن تظهر بالمنصة مرة أخرى.`,
      )
    ) {
      return
    }
    await deleteEmployee(employee.id, employee.employee_photo_path)
    setEmployees((prev) => prev.filter((item) => item.id !== employee.id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-heading">الموظفون</h1>
        <Link
          to="/employees/new"
          className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover"
        >
          إضافة موظف جديد
        </Link>
      </div>

      <input
        type="search"
        placeholder="بحث بالاسم أو رقم الشهادة أو المنشأة"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-6 w-full rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-primary outline-none focus:border-brand-primary"
      />

      {status === 'loading' && <p className="text-text-secondary">جارٍ التحميل...</p>}
      {status === 'error' && <p className="text-expired">تعذر تحميل قائمة الموظفين</p>}
      {status === 'ready' && employees.length === 0 && (
        <p className="text-text-secondary">لا يوجد موظفون مطابقون</p>
      )}

      {status === 'ready' && employees.length > 0 && (
        <div className="flex flex-col gap-4">
          {paginated.map((employee) => {
            const certStatus = computeCertificateStatus(
              employee.is_active,
              employee.expiry_date_gregorian,
            )
            return (
              <div
                key={employee.id}
                className="flex flex-col gap-4 rounded-field border border-divider p-4 sm:flex-row sm:items-center"
              >
                {photoUrls[employee.id] ? (
                  <img
                    src={photoUrls[employee.id]!}
                    alt={employee.employee_name}
                    className="h-16 w-16 rounded-field object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-field bg-surface-muted text-xs text-text-secondary">
                    لا صورة
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-heading">{employee.employee_name}</p>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold text-text-secondary">
                      {CERTIFICATE_STATUS_LABELS[certStatus]}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {employee.certificate_number} · {employee.profession} · {employee.establishment_name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(employee.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/employees/${employee.id}`}
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    عرض
                  </Link>
                  <Link
                    to={`/employees/${employee.id}/edit`}
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    تعديل
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopy(employee.public_token)}
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    نسخ الرابط
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(employee)}
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    تنزيل QR
                  </button>
                  <a
                    href={getEmployeePublicUrl(employee.public_token)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    الصفحة العامة
                  </a>
                  <Link
                    to={`/employees/${employee.id}/print`}
                    className="rounded-button border border-divider px-3 py-1.5 text-xs font-bold hover:bg-surface-muted"
                  >
                    طباعة
                  </Link>
                  {employee.is_active && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(employee.id)}
                      className="rounded-button border border-expired px-3 py-1.5 text-xs font-bold text-expired hover:bg-red-50"
                    >
                      إلغاء التفعيل
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(employee)}
                    className="rounded-button bg-expired px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                  >
                    حذف نهائي
                  </button>
                </div>
              </div>
            )
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              className="self-center rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
            >
              تحميل المزيد
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default EmployeeListPage
