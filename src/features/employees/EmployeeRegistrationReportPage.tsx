import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEmployees } from './api'
import type { Employee } from '../../types/database'
import { getEmployeeRegistrationDate, formatGregorianDate } from '../../lib/employeeRegistrationDate'

type DayGroup = {
  dateKey: string
  displayDate: string
  employees: Employee[]
}

/** A readable Gregorian day heading, e.g. "الثلاثاء، 21 يوليو 2026". */
function formatRegistrationDisplayDate(date: Date): string {
  return formatGregorianDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Groups employees by the calendar day of their effective registration
 * date (getEmployeeRegistrationDate — created_at, unless the employee was
 * later reactivated, in which case it's the reactivation date), most
 * recent day first, with each day's own employees also most-recent-first.
 * Sorted explicitly rather than relying on the input array's order, since
 * a reactivated employee's effective date can be newer than their
 * original position in a created_at-ordered list.
 */
function groupByRegistrationDay(employees: Employee[]): DayGroup[] {
  const groups = new Map<string, DayGroup>()

  for (const employee of employees) {
    const registrationDate = new Date(getEmployeeRegistrationDate(employee))
    const dateKey = registrationDate.toLocaleDateString('en-CA') // YYYY-MM-DD, a stable grouping key
    let group = groups.get(dateKey)
    if (!group) {
      group = { dateKey, displayDate: formatRegistrationDisplayDate(registrationDate), employees: [] }
      groups.set(dateKey, group)
    }
    group.employees.push(employee)
  }

  const sortedGroups = Array.from(groups.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  for (const group of sortedGroups) {
    group.employees.sort(
      (a, b) =>
        new Date(getEmployeeRegistrationDate(b)).getTime() -
        new Date(getEmployeeRegistrationDate(a)).getTime(),
    )
  }
  return sortedGroups
}

function EmployeeRegistrationReportPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listEmployees()
      .then((data) => {
        if (!cancelled) setEmployees(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError('تعذر تحميل التقرير، يرجى تحديث الصفحة')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loadError) return <p className="text-expired">{loadError}</p>
  if (!employees) return <p className="text-text-secondary">جارٍ التحميل...</p>

  const groups = groupByRegistrationDay(employees)
  const totalEmployees = employees.length

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-heading">تقرير التسجيل اليومي</h1>
        <div className="flex gap-3">
          <Link
            to="/employees"
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
      </div>

      {groups.length === 0 && <p className="text-text-secondary">لا يوجد موظفون مسجّلون بعد</p>}

      {groups.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3 rounded-field border border-divider bg-surface-muted p-4">
          <div className="flex-1 min-w-[8rem]">
            <p className="text-xs font-bold text-text-secondary">إجمالي الموظفين</p>
            <p className="text-lg font-bold text-heading">{totalEmployees}</p>
          </div>
          <div className="flex-1 min-w-[8rem]">
            <p className="text-xs font-bold text-text-secondary">عدد أيام التسجيل</p>
            <p className="text-lg font-bold text-heading">{groups.length}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.dateKey} className="overflow-hidden rounded-field border border-divider">
            <div className="flex items-center justify-between bg-surface-muted px-4 py-3">
              <p className="font-bold text-heading">{group.displayDate}</p>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-text-secondary">
                العدد الإجمالي: {group.employees.length}
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
                  </tr>
                </thead>
                <tbody>
                  {group.employees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className={index % 2 === 1 ? 'bg-surface-muted/50' : undefined}
                    >
                      <td className="px-4 py-2 text-text-secondary">{index + 1}</td>
                      <td className="px-4 py-2 font-bold text-heading">{employee.employee_name}</td>
                      <td dir="ltr" className="px-4 py-2 text-right text-text-secondary">
                        {employee.identity_number}
                      </td>
                      <td className="px-4 py-2 text-text-secondary">{employee.nationality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default EmployeeRegistrationReportPage
