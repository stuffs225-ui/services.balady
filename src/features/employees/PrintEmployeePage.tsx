import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeById } from './api'
import type { Employee } from '../../types/database'
import { getEmployeePublicUrl } from '../../lib/publicUrl'
import EmployeeCardRenderer from '../../components/card/EmployeeCardRenderer'
import { useSiteSettings } from '../settings/useSiteSettings'

function PrintEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const { employeeCardTemplateUrl, employeeCardLayout } = useSiteSettings()

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const data = await getEmployeeById(id!)
      if (!cancelled) setEmployee(data)
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

      <div className="mx-auto max-w-2xl">
        {employeeCardTemplateUrl ? (
          <div className="shadow-md print:shadow-none">
            <EmployeeCardRenderer
              templateUrl={employeeCardTemplateUrl}
              employee={employee}
              publicUrl={getEmployeePublicUrl(employee.public_token)}
              layout={employeeCardLayout}
            />
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
