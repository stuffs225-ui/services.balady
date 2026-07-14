import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeById, getEmployeePhotoUrl } from './api'
import type { Employee } from '../../types/database'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import { generateQrDataUrl } from '../../lib/qrcode'
import Logo from '../../components/brand/Logo'
import { siteIdentity } from '../../config/siteLinks'

function PrintEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const data = await getEmployeeById(id!)
      if (cancelled || !data) return
      setEmployee(data)

      const [photo, qr] = await Promise.all([
        getEmployeePhotoUrl(data.employee_photo_path),
        generateQrDataUrl(getEmployeePublicUrl(data.public_token)),
      ])
      if (!cancelled) {
        setPhotoUrl(photo)
        setQrDataUrl(qr)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (!employee) return <p className="p-8 text-text-secondary">جارٍ التحميل...</p>

  return (
    <div className="min-h-svh bg-surface-muted p-6 print:bg-white print:p-0">
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
          className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover"
        >
          طباعة
        </button>
      </div>

      <div className="mx-auto max-w-2xl rounded-field border border-divider bg-surface p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="mb-6 flex flex-col items-center gap-2 border-b border-divider pb-6 text-center">
          <Logo />
          <h1 className="text-lg font-bold text-heading">{siteIdentity.nameAr}</h1>
          <p className="text-sm font-medium text-brand-primary">({siteIdentity.demoLabel})</p>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3">
          {photoUrl && (
            <img src={photoUrl} alt={employee.employee_name} className="h-36 w-36 rounded-field object-cover" />
          )}
          <p className="text-xl font-bold text-heading">{employee.employee_name}</p>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-bold text-text-primary">رقم الشهادة الصحية</dt>
            <dd className="text-text-secondary">{employee.certificate_number}</dd>
          </div>
          <div>
            <dt className="font-bold text-text-primary">المهنة</dt>
            <dd className="text-text-secondary">{employee.profession}</dd>
          </div>
          <div>
            <dt className="font-bold text-text-primary">اسم المنشأة</dt>
            <dd className="text-text-secondary">{employee.establishment_name}</dd>
          </div>
          <div>
            <dt className="font-bold text-text-primary">تاريخ الإصدار</dt>
            <dd className="text-text-secondary">{employee.issue_date_gregorian}</dd>
          </div>
          <div>
            <dt className="font-bold text-text-primary">تاريخ الانتهاء</dt>
            <dd className="text-text-secondary">{employee.expiry_date_gregorian}</dd>
          </div>
        </dl>

        {qrDataUrl && (
          <div className="flex justify-center border-t border-divider pt-6">
            <img src={qrDataUrl} alt="رمز الاستجابة السريعة" className="h-32 w-32" />
          </div>
        )}
      </div>
    </div>
  )
}

export default PrintEmployeePage
