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

function EmployeeCertificateCard({ employee, photoUrl, qrDataUrl }: EmployeeCertificateCardProps) {
  const fields = buildFields(employee)

  return (
    <div
      dir="rtl"
      className="rounded-field border-2 border-certificate-border p-6"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7f9fb 100%)' }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-certificate-heading sm:text-3xl">
              {employee.employee_name}
            </h2>
            <p className="text-xs font-medium text-brand-primary">({siteIdentity.demoLabel})</p>
          </div>
        </div>

        {photoUrl ? (
          <img
            src={photoUrl}
            alt={employee.employee_name}
            className="h-32 w-32 shrink-0 rounded-sm border-2 border-certificate-border object-cover"
          />
        ) : (
          <div className="h-32 w-32 shrink-0 rounded-sm border-2 border-certificate-border bg-surface-muted" />
        )}
      </div>

      <div className="flex items-start gap-6">
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="mb-1 text-sm font-bold text-text-primary">{field.label}</p>
              <p dir={field.dir ?? 'rtl'} className="text-sm text-text-secondary">
                {field.value || '—'}
              </p>
            </div>
          ))}
        </div>

        {qrDataUrl && (
          <img src={qrDataUrl} alt="رمز الاستجابة السريعة" className="h-28 w-28 shrink-0" />
        )}
      </div>
    </div>
  )
}

export default EmployeeCertificateCard
