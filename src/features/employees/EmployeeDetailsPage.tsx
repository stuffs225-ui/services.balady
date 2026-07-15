import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getEmployeeById, getEmployeePhotoUrl, deactivateEmployee } from './api'
import type { Employee } from '../../types/database'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import { generateQrDataUrl, downloadQrDataUrl } from '../../lib/qrcode'
import { computeCertificateStatus, CERTIFICATE_STATUS_LABELS } from '../../lib/certificateStatus'

const DETAIL_ROWS: Array<{ label: string; key: keyof Employee }> = [
  { label: 'الأمانة', key: 'authority_name' },
  { label: 'البلدية', key: 'municipality_name' },
  { label: 'الاسم', key: 'employee_name' },
  { label: 'رقم الهوية', key: 'identity_number' },
  { label: 'الجنس', key: 'gender' },
  { label: 'الجنسية', key: 'nationality' },
  { label: 'رقم الشهادة الصحية', key: 'certificate_number' },
  { label: 'المهنة', key: 'profession' },
  { label: 'تاريخ إصدار الشهادة الصحية هجري', key: 'issue_date_hijri' },
  { label: 'تاريخ إصدار الشهادة الصحية ميلادي', key: 'issue_date_gregorian' },
  { label: 'تاريخ نهاية الشهادة الصحية هجري', key: 'expiry_date_hijri' },
  { label: 'تاريخ نهاية الشهادة الصحية ميلادي', key: 'expiry_date_gregorian' },
  { label: 'نوع البرنامج التثقيفي', key: 'program_type' },
  { label: 'تاريخ انتهاء البرنامج التثقيفي', key: 'program_completion_date_hijri' },
  { label: 'رقم الرخصة', key: 'license_number' },
  { label: 'اسم المنشأة', key: 'establishment_name' },
  { label: 'رقم المنشأة', key: 'establishment_number' },
]

function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const successMessage = (location.state as { created?: boolean; updated?: boolean } | null)
    ?.created
    ? 'تم إنشاء الموظف بنجاح'
    : (location.state as { updated?: boolean } | null)?.updated
      ? 'تم حفظ التعديلات بنجاح'
      : null

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const data = await getEmployeeById(id!)
        if (cancelled || !data) {
          if (!cancelled) setIsLoading(false)
          return
        }
        setEmployee(data)

        const publicUrl = getEmployeePublicUrl(data.public_token)
        const [photo, qr] = await Promise.all([
          getEmployeePhotoUrl(data.employee_photo_path),
          generateQrDataUrl(publicUrl),
        ])
        if (!cancelled) {
          setPhotoUrl(photo)
          setQrDataUrl(qr)
        }
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل بيانات الموظف، يرجى تحديث الصفحة')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleCopy() {
    if (!employee) return
    await navigator.clipboard.writeText(getEmployeePublicUrl(employee.public_token))
    setCopyStatus('copied')
    setTimeout(() => setCopyStatus('idle'), 2000)
  }

  async function handleDeactivate() {
    if (!employee) return
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا الموظف؟')) return
    await deactivateEmployee(employee.id)
    navigate('/employees')
  }

  if (isLoading) return <p className="text-text-secondary">جارٍ التحميل...</p>
  if (loadError) return <p className="text-expired">{loadError}</p>
  if (!employee) return <p className="text-expired">تعذر العثور على الموظف</p>

  const publicUrl = getEmployeePublicUrl(employee.public_token)
  const status = computeCertificateStatus(employee.is_active, employee.expiry_date_gregorian)

  return (
    <div className="mx-auto max-w-3xl">
      {successMessage && (
        <p className="mb-4 rounded-field bg-brand-primary-soft/20 px-4 py-3 text-sm font-bold text-brand-primary">
          {successMessage}
        </p>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">تفاصيل الموظف</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-text-secondary">
          {CERTIFICATE_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="mb-8 flex flex-col items-center gap-4 border-b border-divider pb-8 sm:flex-row sm:items-start">
        {photoUrl ? (
          <img src={photoUrl} alt={employee.employee_name} className="h-32 w-32 rounded-field object-cover" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-field bg-surface-muted text-xs text-text-secondary">
            لا توجد صورة
          </div>
        )}

        <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
          <p className="text-lg font-bold text-heading">{employee.employee_name}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/employees/${employee.id}/edit`}
              className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
            >
              تعديل
            </Link>
            <Link
              to={`/employees/${employee.id}/print`}
              className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
            >
              طباعة
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
            >
              فتح الصفحة العامة
            </a>
            <button
              type="button"
              onClick={handleDeactivate}
              className="rounded-button border border-expired px-4 py-2 text-sm font-bold text-expired hover:bg-red-50"
            >
              إلغاء التفعيل
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        {DETAIL_ROWS.map((row) => (
          <div key={row.key}>
            <p className="mb-1 text-sm font-bold text-text-primary">{row.label}</p>
            <p className="rounded-field border border-input-border bg-input-bg px-4 py-3 text-text-secondary">
              {(employee[row.key] as string | null) || '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-field border border-divider p-6 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="text-sm font-bold text-text-primary">الرابط العام</p>
          <p dir="ltr" className="text-sm text-text-secondary">
            {publicUrl}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
          >
            {copyStatus === 'copied' ? 'تم النسخ' : 'نسخ الرابط'}
          </button>
        </div>

        {qrDataUrl && (
          <div className="flex flex-col items-center gap-2">
            <img src={qrDataUrl} alt="رمز الاستجابة السريعة" className="h-32 w-32" />
            <button
              type="button"
              onClick={() => downloadQrDataUrl(qrDataUrl, `qr-${employee.certificate_number}.png`)}
              className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
            >
              تنزيل رمز QR
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDetailsPage
