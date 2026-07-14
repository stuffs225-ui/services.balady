import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeById, getEmployeePhotoUrl } from './api'
import type { Employee } from '../../types/database'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import { generateQrDataUrl } from '../../lib/qrcode'
import Logo from '../../components/brand/Logo'
import { siteIdentity } from '../../config/siteLinks'
import EmployeeCertificateCard from './EmployeeCertificateCard'
import CertificateInstructionsCard from './CertificateInstructionsCard'

const CARD_PAGE_STYLE = `
  @media print {
    @page {
      size: 85.6mm 54mm;
      margin: 0;
    }
  }
`

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
          className="rounded-button bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover"
        >
          طباعة
        </button>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <div className="mb-4 flex flex-col items-center gap-1 text-center print:hidden">
          <Logo />
          <p className="text-sm font-bold text-heading">{siteIdentity.nameAr}</p>
          <p className="text-xs font-medium text-brand-primary">({siteIdentity.demoLabel})</p>
          <p className="mt-1 text-xs text-text-secondary">
            بطاقة بحجم البطاقة الشخصية (85.6×54 ملم) — وجهان: البيانات والتعليمات
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 print:block print:gap-0">
          <div className="shadow-md print:break-after-page print:shadow-none">
            <EmployeeCertificateCard employee={employee} photoUrl={photoUrl} qrDataUrl={qrDataUrl} />
          </div>
          <div className="shadow-md print:shadow-none">
            <CertificateInstructionsCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintEmployeePage
