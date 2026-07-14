import Logo from '../../components/brand/Logo'
import { siteIdentity } from '../../config/siteLinks'
import type { Employee } from '../../types/database'

type CardField = {
  label: string
  value: string | null
  dir?: 'ltr' | 'rtl'
}

function buildFields(employee: Employee): CardField[] {
  return [
    { label: 'رقم الهوية', value: employee.identity_number, dir: 'ltr' },
    { label: 'الجنسية', value: employee.nationality },
    { label: 'رقم الشهادة الصحية', value: employee.certificate_number, dir: 'ltr' },
    { label: 'المهنة', value: employee.profession },
    { label: 'تاريخ إصدار الشهادة الصحية', value: employee.issue_date_hijri, dir: 'ltr' },
    { label: 'تاريخ نهاية الشهادة الصحية', value: employee.expiry_date_hijri, dir: 'ltr' },
    { label: 'نوع البرنامج التثقيفي', value: employee.program_type },
    { label: 'تاريخ انتهاء البرنامج التثقيفي', value: employee.program_completion_date_hijri, dir: 'ltr' },
  ]
}

type EmployeeCertificateCardProps = {
  employee: Employee
  photoUrl: string | null
  qrDataUrl: string | null
}

/**
 * Matches the field layout of the reference "unified health certificate"
 * card (ID-card sized, two-column field grid, photo+QR in a side column),
 * but with the app's own neutral demo branding instead of any real
 * government logo/seal.
 */
function EmployeeCertificateCard({ employee, photoUrl, qrDataUrl }: EmployeeCertificateCardProps) {
  const fields = buildFields(employee)

  return (
    <div
      dir="rtl"
      className="relative flex flex-col justify-between overflow-hidden rounded-field border border-certificate-border bg-white p-[3mm] print:rounded-none"
      style={{ width: '85.6mm', height: '54mm' }}
    >
      <div className="flex items-start justify-between gap-[2mm]">
        <div className="text-right">
          <p className="text-[7px] leading-tight font-bold text-certificate-heading">
            الشهادة الصحية الموحدة
          </p>
          <p className="text-[5.5px] font-medium text-brand-primary">({siteIdentity.demoLabel})</p>
        </div>
        <Logo className="h-[6mm] w-[6mm] shrink-0" />
      </div>

      <p className="truncate text-[10px] font-bold text-certificate-heading">
        {employee.employee_name}
      </p>

      <div className="flex flex-1 gap-[2mm]">
        <div className="grid flex-1 grid-cols-2 content-start gap-x-[2mm] gap-y-[1.3mm]">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="certificate-field-label text-[5px] leading-tight font-bold text-text-primary">
                {field.label}
              </p>
              <p dir={field.dir ?? 'rtl'} className="truncate text-[6px] leading-tight text-field-value">
                {field.value || '—'}
              </p>
            </div>
          ))}
        </div>

        <div className="flex w-[16mm] shrink-0 flex-col gap-[1.5mm]">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={employee.employee_name}
              className="h-[16mm] w-[16mm] rounded-sm border border-certificate-border object-cover"
            />
          ) : (
            <div className="h-[16mm] w-[16mm] rounded-sm border border-certificate-border bg-field-bg" />
          )}

          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="رمز الاستجابة السريعة"
              className="h-[13mm] w-[13mm] border border-certificate-border object-contain"
            />
          ) : (
            <div className="h-[13mm] w-[13mm] border border-certificate-border bg-field-bg" />
          )}
        </div>
      </div>

      <p className="border-t border-certificate-border pt-[0.8mm] text-center text-[5px] text-text-secondary">
        {siteIdentity.demoDisclaimer}
      </p>
    </div>
  )
}

export default EmployeeCertificateCard
