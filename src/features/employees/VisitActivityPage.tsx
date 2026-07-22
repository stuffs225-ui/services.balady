import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listVisitEventsSince, getEmployeeVisitSummaries, type EmployeeVisitSummary } from './api'
import { startOfTodayIso } from '../../lib/dates'
import {
  groupVisitsByEmployee,
  buildLeaderboard,
  buildVisitAlerts,
  type VisitAlert,
} from '../../lib/visitActivity'

const TOP_LEADERBOARD_SIZE = 5

type ViewState = {
  leaderboard: { employee: EmployeeVisitSummary; visitCount: number }[]
  alerts: { employee: EmployeeVisitSummary; alert: VisitAlert }[]
  totalVisitsToday: number
}

function severityClasses(priority: number): string {
  return priority >= 2
    ? 'border-expired/30 bg-expired/5 text-expired'
    : 'border-warning/30 bg-warning/5 text-warning'
}

function VisitActivityPage() {
  const [view, setView] = useState<ViewState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const events = await listVisitEventsSince(startOfTodayIso())
        const activities = groupVisitsByEmployee(events)
        const employeeIds = Array.from(new Set(events.map((event) => event.employee_id)))
        const summaries = await getEmployeeVisitSummaries(employeeIds)
        const summaryById = new Map(summaries.map((summary) => [summary.id, summary]))

        const leaderboard = buildLeaderboard(activities)
          .slice(0, TOP_LEADERBOARD_SIZE)
          .flatMap((entry) => {
            const employee = summaryById.get(entry.employeeId)
            return employee ? [{ employee, visitCount: entry.visitCount }] : []
          })

        const alerts = buildVisitAlerts(activities).flatMap((alert) => {
          const employee = summaryById.get(alert.employeeId)
          return employee ? [{ employee, alert }] : []
        })

        if (!cancelled) {
          setView({ leaderboard, alerts, totalVisitsToday: events.length })
        }
      } catch {
        if (!cancelled) setLoadError('تعذر تحميل نشاط الزيارات، يرجى تحديث الصفحة')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">متابعة زيارات اليوم</h1>
        <Link
          to="/employees"
          className="rounded-button border border-divider px-4 py-2 text-sm font-bold hover:bg-surface-muted"
        >
          رجوع
        </Link>
      </div>

      {loadError && <p className="text-expired">{loadError}</p>}
      {!loadError && !view && <p className="text-text-secondary">جارٍ التحميل...</p>}

      {view && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-bold text-heading">الأكثر زيارة اليوم</h2>
            {view.leaderboard.length === 0 ? (
              <p className="rounded-field border border-divider p-4 text-text-secondary">
                لا توجد زيارات مسجّلة اليوم بعد
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {view.leaderboard.map(({ employee, visitCount }, index) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-4 rounded-field border border-divider p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-heading">{employee.employee_name}</p>
                      <p className="text-xs text-text-secondary">
                        {employee.certificate_number} · {employee.profession}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-text-secondary">
                      {visitCount} {visitCount === 1 ? 'زيارة' : 'زيارات'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-bold text-heading">التنبيهات</h2>
            {view.alerts.length === 0 ? (
              <p className="rounded-field border border-divider p-4 text-text-secondary">
                لا توجد تنبيهات — نشاط الزيارات اليوم طبيعي
              </p>
            ) : (
              <div className="overflow-x-auto rounded-field border border-divider">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-divider bg-surface-muted text-text-secondary">
                      <th className="px-4 py-2 font-bold">الموظف</th>
                      <th className="px-4 py-2 font-bold">رقم الهوية</th>
                      <th className="px-4 py-2 font-bold">سبب التنبيه</th>
                      <th className="px-4 py-2 font-bold">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.alerts.map(({ employee, alert }, index) => (
                      <tr key={`${employee.id}-${index}`} className="border-t border-divider">
                        <td className="px-4 py-2 font-bold text-heading">{employee.employee_name}</td>
                        <td dir="ltr" className="px-4 py-2 text-right text-text-secondary">
                          {employee.identity_number}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClasses(alert.priority)}`}
                          >
                            {alert.reason}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{alert.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default VisitActivityPage
